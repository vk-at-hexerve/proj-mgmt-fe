'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Hexagon, Loader2, MailCheck } from 'lucide-react';
import { useApp } from '@/lib/app-context';

export default function ForgotPasswordPage() {
  const { showToast } = useApp();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setIsSuccess(true);
    } catch (error: any) {
      showToast({
        title: "Request failed",
        description: error.message || "Something went wrong.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Hexagon className="size-6 fill-current" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Hexerve Pro</h1>
        </div>
        
        <Card className="border-border/60 shadow-lg">
          {isSuccess ? (
            <>
              <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-2">
                  <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <MailCheck className="size-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <CardTitle className="text-xl">Check your email</CardTitle>
                <CardDescription>
                  If an account exists with {email}, we&apos;ve sent a password reset link.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col gap-4">
                <Link href="/login" className="w-full">
                  <Button className="w-full" variant="outline">
                    Back to Login
                  </Button>
                </Link>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">Forgot Password</CardTitle>
                <CardDescription>
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="name@example.com" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Send Reset Link
                  </Button>
                  <div className="text-center text-sm">
                    Remember your password?{" "}
                    <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                      Back to login
                    </Link>
                  </div>
                </CardFooter>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
