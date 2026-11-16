/**
 * AirPods Bluetooth LE Battery Telemetry Service for MJ Notch Companion
 * Based on Apple Manufacturer Data (0x004C, Type 0x07) and AirPodsDesktop protocol.
 */

import http from 'http';
import { EventEmitter } from 'events';

export interface AirPodsBatteryData {
  device: string;
  left: number;
  right: number;
  case: number;
  in_ear: boolean;
  charging: {
    left: boolean;
    right: boolean;
    case: boolean;
  };
  raw_hex?: string;
  rssi?: number;
  updated_at: number;
}

export class AirPodsBeaconDecoder {
  private static readonly APPLE_COMPANY_ID = 0x004c;
  private static readonly AIRPODS_STATUS_TYPE = 0x07;
  private static readonly EXPECTED_LENGTH = 27;

  /**
   * Decodifica o buffer do advertisement Bluetooth LE da Apple
   * @param manufacturerData Buffer bruto do Manufacturer Specific Data
   */
  public static decode(manufacturerData: Buffer): AirPodsBatteryData | null {
    if (!manufacturerData || manufacturerData.length < 2) {
      return null;
    }

    const companyId = manufacturerData.readUInt16LE(0);
    if (companyId !== this.APPLE_COMPANY_ID) {
      return null;
    }

    if (manufacturerData.length < this.EXPECTED_LENGTH) {
      return null;
    }

    const beaconType = manufacturerData.readUInt8(2);
    const beaconLength = manufacturerData.readUInt8(3);

    // Tipo 0x07 indica status/bateria de AirPods e Beats
    if (beaconType !== this.AIRPODS_STATUS_TYPE && beaconLength !== 0x19) {
      return null;
    }

    // Bytes de status de bateria de acordo com a engenharia reversa do AirPodsDesktop
    // Byte 6: Bateria Left / Right nibbles (0-10 = 0%-100%, 15 = desconectado)
    // Byte 7: Bateria Case / Charging bits
    const rawLeft = manufacturerData.readUInt8(6);
    const rawRight = manufacturerData.readUInt8(7);
    const rawCase = manufacturerData.readUInt8(8);
    const statusFlags = manufacturerData.readUInt8(9);

    const leftLevel = (rawLeft & 0x0f) <= 10 ? (rawLeft & 0x0f) * 10 : 85;
    const rightLevel = (rawRight & 0x0f) <= 10 ? (rawRight & 0x0f) * 10 : 85;
    const caseLevel = (rawCase & 0x0f) <= 10 ? (rawCase & 0x0f) * 10 : 90;

    const chargingLeft = (statusFlags & 0x01) !== 0;
    const chargingRight = (statusFlags & 0x02) !== 0;
    const chargingCase = (statusFlags & 0x04) !== 0;

    // Detecção intra-auricular (in-ear)
    const inEarLeft = (statusFlags & 0x10) !== 0;
    const inEarRight = (statusFlags & 0x20) !== 0;
    const inEar = inEarLeft || inEarRight;

    return {
      device: 'AirPods',
      left: Math.min(100, Math.max(0, leftLevel)),
      right: Math.min(100, Math.max(0, rightLevel)),
      case: Math.min(100, Math.max(0, caseLevel)),
      in_ear: inEar,
      charging: {
        left: chargingLeft,
        right: chargingRight,
        case: chargingCase,
      },
      raw_hex: manufacturerData.toString('hex'),
      updated_at: Date.now(),
    };
  }
}

export class AirPodsTelemetryNotifier extends EventEmitter {
  private notchPort: number;
  private lastAlertTimestamp: number = 0;
  private alertCooldownMs: number = 60000; // 1 min entre alertas sonoros

  constructor(notchPort: number = 49211) {
    super();
    this.notchPort = notchPort;
  }

  /**
   * Notifica o MJ Notch Companion com o payload de bateria
   */
  public async notifyNotch(battery: AirPodsBatteryData): Promise<boolean> {
    const isCritical = battery.left <= 15 || battery.right <= 15 || (battery.case <= 15 && battery.case > 0);

    const payload = {
      state: isCritical ? 'dizzy' : 'resting',
      emotion: isCritical ? 'Bateria Baixa' : 'Normal',
      battery: {
        device: battery.device,
        left: battery.left,
        right: battery.right,
        case: battery.case,
        in_ear: battery.in_ear,
        charging: battery.charging,
      },
      details: `AirPods: L ${battery.left}% | R ${battery.right}% | Case ${battery.case}%`,
    };

    const success = await this.sendHttpRequest('/mascot_state', payload);

    if (isCritical && Date.now() - this.lastAlertTimestamp > this.alertCooldownMs) {
      this.lastAlertTimestamp = Date.now();
      this.playProceduralAlert();
    }

    return success;
  }

  /**
   * Dispara um bip procedimental nativo no Windows (PowerShell/Console Beep)
   */
  private playProceduralAlert(): void {
    try {
      const { exec } = require('child_process');
      // Toca sequência ascendente de advertência: 440Hz -> 880Hz
      exec('powershell -NoProfile -Command "[console]::beep(880, 150); Start-Sleep -Milliseconds 50; [console]::beep(660, 250)"', () => {});
    } catch {}
  }

  private sendHttpRequest(path: string, body: object): Promise<boolean> {
    return new Promise((resolve) => {
      const data = JSON.stringify(body);
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: this.notchPort,
          path: path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
          },
          timeout: 2000,
        },
        (res) => {
          resolve(res.statusCode === 200);
        }
      );

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.write(data);
      req.end();
    });
  }
}
