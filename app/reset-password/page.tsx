'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { resetPassword, validateResetToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Hexagon, Loader2, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { useApp } from '@/lib/app-context';

function ResetPasswordForm() {
  const { showToast } = useApp();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Password strength checks
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isMatch = password && password === confirmPassword;
  
  const canSubmit = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && isMatch;

  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      return;
    }
    
    validateResetToken(token)
      .then(res => {
        setIsValidToken(res.valid);
        setIsValidating(false);
      })
      .catch(() => {
        setIsValidToken(false);
        setIsValidating(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !token) return;
    
    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      setIsSuccess(true);
    } catch (error: any) {
      showToast({
        title: "Reset failed",
        description: error.message || "Something went wrong.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <Card className="border-border/60 shadow-lg p-12 flex flex-col items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Validating reset link...</p>
      </Card>
    );
  }

  if (!isValidToken) {
    return (
      <Card className="border-border/60 shadow-lg text-center">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="size-6 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-xl">Invalid or Expired Link</CardTitle>
          <CardDescription>
            The password reset link is invalid or has expired. Please request a new one.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/forgot-password" className="w-full">
            <Button className="w-full">Request New Link</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="border-border/60 shadow-lg text-center">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="size-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-xl">Password Reset</CardTitle>
          <CardDescription>
            Your password has been successfully reset. You can now log in with your new password.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button className="w-full">Go to Login</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Set New Password</CardTitle>
        <CardDescription>
          Please enter your new password below.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input 
              id="confirm-password" 
              type={showPassword ? "text" : "password"} 
              required 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2 rounded-md bg-muted/50 p-3 text-sm">
            <p className="font-medium mb-2">Password must contain:</p>
            <ul className="space-y-1">
              <li className={`flex items-center gap-2 ${hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                {hasMinLength ? <CheckCircle2 className="size-3.5" /> : <div className="size-3.5 rounded-full border" />}
                At least 8 characters
              </li>
              <li className={`flex items-center gap-2 ${hasUpperCase ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                {hasUpperCase ? <CheckCircle2 className="size-3.5" /> : <div className="size-3.5 rounded-full border" />}
                One uppercase letter
              </li>
              <li className={`flex items-center gap-2 ${hasLowerCase ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                {hasLowerCase ? <CheckCircle2 className="size-3.5" /> : <div className="size-3.5 rounded-full border" />}
                One lowercase letter
              </li>
              <li className={`flex items-center gap-2 ${hasNumber ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                {hasNumber ? <CheckCircle2 className="size-3.5" /> : <div className="size-3.5 rounded-full border" />}
                One number
              </li>
              <li className={`flex items-center gap-2 ${isMatch && password ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                {isMatch && password ? <CheckCircle2 className="size-3.5" /> : <div className="size-3.5 rounded-full border" />}
                Passwords match
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" type="submit" disabled={isSubmitting || !canSubmit}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Reset Password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Hexagon className="size-6 fill-current" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Hexerve Pro</h1>
        </div>
        
        <Suspense fallback={
          <Card className="border-border/60 shadow-lg p-12 flex flex-col items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary mb-4" />
          </Card>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
