import { AsyncLocalStorage } from 'async_hooks';
import type { Device, DeviceStatus, DeviceWorkspace } from '@prisma/client';

export type DeviceContext = {
  device: Device | null;
  workspace: 'mill' | 'sales' | null;
};

export const deviceAls = new AsyncLocalStorage<DeviceContext>();

export function currentDevice(): Device | null {
  return deviceAls.getStore()?.device ?? null;
}

export function currentDeviceId(): string | null {
  return currentDevice()?.id ?? null;
}

export function currentWorkspaceHint(): 'mill' | 'sales' | null {
  return deviceAls.getStore()?.workspace ?? null;
}

export const DEVICE_INSTALLATION_HEADER = 'x-device-installation-id';
export const DEVICE_NAME_HEADER = 'x-device-name';
export const DEVICE_WORKSPACE_HEADER = 'x-oilix-workspace';

export const DEVICE_DISABLED_MESSAGE =
  'هذا الجهاز غير مصرّح له بتنفيذ العمليات.';
export const DEVICE_PENDING_MESSAGE =
  'هذا الجهاز بانتظار موافقة المدير قبل تنفيذ العمليات.';
export const DEVICE_REQUIRED_MESSAGE =
  'يجب تسجيل هذا الجهاز قبل تنفيذ العمليات.';
export const DEVICE_WORKSPACE_MESSAGE =
  'هذا الجهاز غير مسموح له بالعمل في هذه المساحة.';

export function workspaceMatches(
  deviceWorkspace: DeviceWorkspace,
  requested: 'mill' | 'sales' | null,
): boolean {
  if (!requested) return true;
  if (deviceWorkspace === 'BOTH') return true;
  if (requested === 'sales') return deviceWorkspace === 'SALES';
  return deviceWorkspace === 'MILL';
}

export function isWriteMethod(method: string) {
  return ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method.toUpperCase());
}

export function attributedDeviceId(): string | null {
  return currentDeviceId();
}

function pathOf(url: string) {
  return url.split('?')[0].toLowerCase();
}

export function isOilSalesWritePath(url: string, method: string) {
  if (!isWriteMethod(method)) return false;
  const path = pathOf(url);
  if (path.includes('/oil-sales/preview') || path.includes('/oil-sales/next-receipt')) {
    return false;
  }
  return path.includes('/oil-sales/');
}

export function isSensitiveWritePath(url: string, method: string) {
  if (!isWriteMethod(method)) return false;
  const path = pathOf(url);
  if (path.includes('/devices/me')) return false;
  if (path.includes('/auth/')) return false;
  if (path.includes('/oil-sales/preview') || path.includes('/oil-sales/next-receipt')) {
    return false;
  }
  if (path.includes('/oil-sales/')) return true;
  if (
    path.includes('/clients') ||
    path.includes('/olive-entries') ||
    path.includes('/pressing') ||
    path.includes('/payments') ||
    path.includes('/filtration') ||
    path.includes('/mobile')
  ) {
    return true;
  }
  return false;
}

export function deviceWriteBlockReason(
  device: Device | null,
  opts: { method: string; url: string; workspace: 'mill' | 'sales' | null },
): string | null {
  if (!isSensitiveWritePath(opts.url, opts.method)) return null;
  const salesWrite = isOilSalesWritePath(opts.url, opts.method);
  if (!device) {
    // Oil Sales terminals must be registered. Mill/mobile legacy rows stay nullable.
    return salesWrite ? DEVICE_REQUIRED_MESSAGE : null;
  }
  if (device.status === ('DISABLED' as DeviceStatus)) return DEVICE_DISABLED_MESSAGE;
  if (device.status === ('PENDING' as DeviceStatus)) return DEVICE_PENDING_MESSAGE;
  if (!workspaceMatches(device.workspace, opts.workspace)) return DEVICE_WORKSPACE_MESSAGE;
  return null;
}
