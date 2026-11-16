import { AirPodsBeaconDecoder, AirPodsBatteryData, AirPodsTelemetryNotifier } from './airpods_telemetry';
import { spawn } from 'child_process';

/**
 * Windows BLE Advertisement Watcher sem dependências C++ nativas
 * Utiliza o Windows Runtime nativo (Windows.Devices.Bluetooth.Advertisement.BluetoothLEAdvertisementWatcher)
 * executado via PowerShell in-process streaming JSON para stdout.
 */
export class WindowsBleAirPodsWatcher {
  private notifier: AirPodsTelemetryNotifier;
  private isRunning: boolean = false;
  private watcherProcess: any = null;

  constructor(notchPort: number = 49211) {
    this.notifier = new AirPodsTelemetryNotifier(notchPort);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('[AirPodsService] Iniciando monitoramento Bluetooth LE via WinRT...');

    const psScript = `
$ErrorActionPreference = 'SilentlyContinue'
[Windows.Devices.Bluetooth.Advertisement.BluetoothLEAdvertisementWatcher, Windows.Devices.Bluetooth, ContentType = WindowsRuntime] | Out-Null
$watcher = [Windows.Devices.Bluetooth.Advertisement.BluetoothLEAdvertisementWatcher]::new()
$watcher.ScanningMode = [Windows.Devices.Bluetooth.Advertisement.BluetoothLEScanningMode]::Active

$action = {
    param($sender, $eventArgs)
    $adv = $eventArgs.Advertisement
    foreach ($m in $adv.ManufacturerData) {
        if ($m.CompanyId -eq 0x004C) {
            $reader = [Windows.Storage.Streams.DataReader]::FromBuffer($m.Data)
            $bytes = [byte[]]::new($reader.UnconsumedBufferLength)
            $reader.ReadBytes($bytes)
            $hex = [BitConverter]::ToString($bytes) -replace '-'
            if ($hex.Length -ge 50) {
                Write-Output "ADV:004C:$hex"
            }
        }
    }
}

Register-ObjectEvent -InputObject $watcher -EventName "Received" -Action $action | Out-Null
$watcher.Start()

while ($true) {
    Start-Sleep -Seconds 1
}
`;

    this.watcherProcess = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', psScript]);

    this.watcherProcess.stdout.on('data', (data: Buffer) => {
      const lines = data.toString().split(/\r?\n/);
      for (const line of lines) {
        if (line.startsWith('ADV:004C:')) {
          const hex = line.substring(9).trim();
          const buffer = Buffer.concat([Buffer.from([0x4c, 0x00]), Buffer.from(hex, 'hex')]);
          const decoded = AirPodsBeaconDecoder.decode(buffer);
          if (decoded) {
            this.notifier.notifyNotch(decoded);
          }
        }
      }
    });

    this.watcherProcess.on('exit', () => {
      if (this.isRunning) {
        console.log('[AirPodsService] Processo Bluetooth finalizado. Reconectando em 3s...');
        setTimeout(() => this.start(), 3000);
      }
    });
  }

  public stop(): void {
    this.isRunning = false;
    if (this.watcherProcess) {
      this.watcherProcess.kill();
      this.watcherProcess = null;
    }
  }
}

if (require.main === module) {
  const service = new WindowsBleAirPodsWatcher(49211);
  service.start();
}
