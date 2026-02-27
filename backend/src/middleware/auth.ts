import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  walletAddress?: string | null;
}

interface VendorJwtPayload {
  id: string;
  email: string;
  companyName: string;
  isVerified: boolean;
  tokenType: "vendor";
}

/**
 * Middleware that verifies the JWT bearer token and attaches user to request.
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      walletAddress: decoded.walletAddress,
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Middleware that verifies a vendor JWT and attaches vendor to request.
 */
export function authenticateVendor(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Vendor authentication required" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as VendorJwtPayload;
    if (decoded.tokenType !== "vendor") {
      res.status(401).json({ error: "Invalid vendor token" });
      return;
    }
    req.vendor = {
      id: decoded.id,
      email: decoded.email,
      companyName: decoded.companyName,
      isVerified: decoded.isVerified,
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired vendor token" });
  }
}

/**
 * Middleware that requires the vendor to be verified by the platform admin.
 */
export function requireVerifiedVendor(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.vendor) {
    res.status(401).json({ error: "Vendor authentication required" });
    return;
  }
  if (!req.vendor.isVerified) {
    res.status(403).json({ error: "Vendor account is not yet verified by the platform" });
    return;
  }
  next();
}

/**
 * Middleware that requires the user to have a specific role.
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

/**
 * Generate a JWT token for a user.
 */
export function generateToken(payload: JwtPayload): string {
  const expiresIn = process.env.JWT_EXPIRY || "7d";
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn as string & { __brand: "StringValue" },
  } as jwt.SignOptions);
}

/**
 * Generate a JWT token for a vendor.
 */
export function generateVendorToken(payload: Omit<VendorJwtPayload, "tokenType">): string {
  const expiresIn = process.env.JWT_EXPIRY || "7d";
  return jwt.sign({ ...payload, tokenType: "vendor" }, JWT_SECRET, {
    expiresIn: expiresIn as string & { __brand: "StringValue" },
  } as jwt.SignOptions);
}

