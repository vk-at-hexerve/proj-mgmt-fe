import React from "react";
import { useApp } from "./app-context";

interface PermissionGateProps {
  permission: string;
  scopeType?: "global" | "project" | "team";
  scopeId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Hook to check if the current user has a specific permission.
 * For MVP, this does a flat check against the user's resolved permissions.
 * The backend enforces strict scope checking.
 */
export function usePermission() {
  const { currentUser } = useApp();

  const hasPermission = (
    permission: string,
    scopeType?: "global" | "project" | "team",
    scopeId?: string
  ) => {
    if (!currentUser) return false;
    
    // Super-admin escape hatch
    if (currentUser.permissions.includes("*")) {
      return true;
    }
    
    // For now, doing a flat check against the permissions array returned from the backend.
    // The backend PermissionService resolved all applicable permissions (global + any scoped ones).
    // The backend acts as the source of truth and enforces strict scoping on requests.
    return currentUser.permissions.includes(permission);
  };

  return { hasPermission };
}

/**
 * Component to conditionally render UI elements based on permissions.
 */
export function PermissionGate({
  permission,
  scopeType,
  scopeId,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission } = usePermission();
  const allowed = hasPermission(permission, scopeType, scopeId);

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
