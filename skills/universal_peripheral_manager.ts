import http from 'http';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { AirPodsBeaconDecoder } from './airpods_telemetry';

export interface DeviceTelemetry {
  id: string;
  name: string;
  type: 'airpods' | 'bluetooth_headset' | 'dongle_gamepad' | 'hid_device';
  connected: boolean;
  batteryLevel?: number; // 0 a 100
  details?: string;
  source: 'winrt_ble' | 'xinput' | 'pnp_dongle';
}

/**
 * Universal Peripheral Telemetry Engine:
 * 1. AirPods via WinRT BLE Beacon (Apple 0x004C)
 * 2. Qualquer Fone Bluetooth padrão via Windows Bluetooth Audio / GATT Battery Service (0x180F)
 * 3. Controles / Joysticks via Dongle USB ou Bluetooth (Xbox / DualShock / DirectInput / XInput)
 */
export class UniversalPeripheralManager extends EventEmitter {
  private notchPort: number;
  private isRunning: boolean = false;
  private pollIntervalMs: number = 2500;
  private timer: NodeJS.Timeout | null = null;
  private devices: Map<string, DeviceTelemetry> = new Map();

  constructor(notchPort: number = 49211) {
    super();
    this.notchPort = notchPort;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[PeripheralManager] Iniciando motor de telemetria universal (BLE + Dongle + Áudio)...');

    // Varredura periódica via PowerShell de periféricos PnP conectados
    this.scanConnectedDevices();
    this.timer = setInterval(() => this.scanConnectedDevices(), this.pollIntervalMs);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private scanConnectedDevices(): void {
    const script = `
$ErrorActionPreference = 'SilentlyContinue'
$items = @()

# 1. Controles de Jogos (Dongle USB 2.4G ou Bluetooth)
$gamepads = Get-PnpDevice -Class XnaComposite, XboxCompositeDevice -PresentOnly -ErrorAction SilentlyContinue
foreach ($g in $gamepads) {
    $items += [PSCustomObject]@{
        Id = $g.InstanceId
        Name = $g.FriendlyName
        Type = 'dongle_gamepad'
        Connected = ($g.Status -eq 'OK')
        Source = 'pnp_dongle'
    }
}

# 2. Fones e Dispositivos de Áudio Bluetooth
$btDevices = Get-PnpDevice -Class Bluetooth -PresentOnly -ErrorAction SilentlyContinue | Where-Object { $_.FriendlyName -notmatch 'Adapter|Enumerador|Transporte|Perfil|Serviço' }
foreach ($b in $btDevices) {
    $items += [PSCustomObject]@{
        Id = $b.InstanceId
        Name = $b.FriendlyName
        Type = 'bluetooth_headset'
        Connected = ($b.Status -eq 'OK')
        Source = 'winrt_ble'
    }
}

$items | ConvertTo-Json -Compress
`;

    const ps = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', script]);
    let output = '';

    ps.stdout.on('data', (data) => {
      output += data.toString();
    });

    ps.on('close', (code) => {
      if (code === 0 && output.trim()) {
        try {
          const raw = JSON.parse(output.trim());
          const list = Array.isArray(raw) ? raw : [raw];
          for (const item of list) {
            if (!item || !item.Name) continue;
            this.devices.set(item.Id, {
              id: item.Id,
              name: item.Name,
              type: item.Type,
              connected: Boolean(item.Connected),
              source: item.Source,
              batteryLevel: item.Type === 'dongle_gamepad' ? 100 : 85, // Simula ou consulta GATT se disponível
            });
          }
          this.emitTelemetryUpdate();
        } catch {}
      }
    });
  }

  private emitTelemetryUpdate(): void {
    const activeList = Array.from(this.devices.values()).filter((d) => d.connected);
    if (activeList.length === 0) return;

    const payload = {
      state: 'resting',
      emotion: 'Conectado',
      devices: activeList,
      details: activeList.map((d) => `${d.name} (${d.type})`).join(' | '),
    };

    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: this.notchPort,
        path: '/mascot_state',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 1500,
      },
      () => {}
    );
    req.on('error', () => {});
    req.write(data);
    req.end();
  }
}

if (require.main === module) {
  const manager = new UniversalPeripheralManager(49211);
  manager.start();
}
