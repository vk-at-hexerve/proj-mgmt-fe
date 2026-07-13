"use client";

import { useState, useEffect } from "react";
import { Mail, Check, AlertCircle, Save, Eye, EyeOff, Loader2, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getEmailConfig, updateEmailConfig, testEmailConfig, toggleEmailService } from "@/lib/api";
import { EmailConfig, EmailConfigUpdate } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/lib/app-context";

export function EmailConfigPanel() {
  const { toast } = useToast();
  const { hasPermission } = useApp();
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [encryptionType, setEncryptionType] = useState<"TLS" | "SSL" | "NONE">("TLS");
  const [isEnabled, setIsEnabled] = useState(true);
  
  // Test email state
  const [testRecipient, setTestRecipient] = useState("");

  const canEdit = hasPermission("settings:update");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const data = await getEmailConfig();
      setConfig(data);
      setSenderEmail(data.senderEmail);
      setSenderName(data.senderName);
      setSmtpHost(data.smtpHost);
      setSmtpPort(data.smtpPort);
      setSmtpUsername(data.smtpUsername || "");
      setSmtpPassword(data.smtpPassword); // "••••••••"
      setEncryptionType(data.encryptionType);
      setIsEnabled(data.isEnabled);
    } catch (error: any) {
      if (error.message?.includes("404") || error.message?.includes("No email configuration found")) {
        // First-time setup, leave form empty
      } else {
        toast({
          title: "Failed to load configuration",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!senderEmail || !senderName || !smtpHost || !smtpPort) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Email, Name, Host, Port).",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const updateData: EmailConfigUpdate = {
        sender_email: senderEmail,
        sender_name: senderName,
        smtp_host: smtpHost,
        smtp_port: Number(smtpPort),
        smtp_username: smtpUsername || null,
        smtp_password: smtpPassword || null,
        encryption_type: encryptionType,
        is_enabled: isEnabled,
      };

      const updated = await updateEmailConfig(updateData);
      setConfig(updated);
      setSmtpPassword(updated.smtpPassword);
      
      toast({
        title: "Configuration Saved",
        description: "Email settings have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to save",
        description: error.message || "An error occurred while saving the configuration.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testRecipient) {
      toast({
        title: "Missing Recipient",
        description: "Please enter an email address to send the test to.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsTesting(true);
      const result = await testEmailConfig({
        sender_email: senderEmail,
        sender_name: senderName,
        smtp_host: smtpHost,
        smtp_port: Number(smtpPort),
        smtp_username: smtpUsername || null,
        smtp_password: smtpPassword || null,
        encryption_type: encryptionType,
        test_recipient: testRecipient,
      });

      if (result.success) {
        toast({
          title: "Test Successful",
          description: result.message,
          variant: "default",
          className: "bg-green-50 text-green-900 border-green-200",
        });
        loadConfig(); // Reload to get updated test timestamp
      } else {
        toast({
          title: "Test Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message || "An unexpected error occurred during the test.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    setIsEnabled(checked);
    if (config) {
      try {
        await toggleEmailService(checked);
        toast({
          title: checked ? "Service Enabled" : "Service Disabled",
          description: `Outgoing email delivery is now ${checked ? "active" : "paused"}.`,
        });
      } catch (error: any) {
        setIsEnabled(!checked);
        toast({
          title: "Toggle Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <Card className="border-red-100 bg-red-50/50">
        <CardContent className="pt-6 text-center text-red-800">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
          <h3 className="font-medium text-lg">Access Denied</h3>
          <p className="text-sm">You do not have permission to view or modify email settings.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header section with master toggle */}
      <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-500" />
            Outgoing Email Configuration
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure the SMTP server used to send platform notifications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="service-toggle" className="text-sm font-medium">
            {isEnabled ? (
              <span className="text-green-600 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span> Active</span>
            ) : (
              <span className="text-slate-500">Paused</span>
            )}
          </Label>
          <Switch 
            id="service-toggle" 
            checked={isEnabled} 
            onCheckedChange={handleToggle}
            disabled={!config}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-lg">Sender Identity</CardTitle>
              <CardDescription>How the emails will appear to recipients.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sender Name <span className="text-red-500">*</span></Label>
                  <Input 
                    placeholder="e.g. NexusPM Notifications" 
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sender Email Address <span className="text-red-500">*</span></Label>
                  <Input 
                    type="email" 
                    placeholder="notifications@company.com" 
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-lg">SMTP Connection</CardTitle>
              <CardDescription>Server details provided by your email provider.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>SMTP Host <span className="text-red-500">*</span></Label>
                  <Input 
                    placeholder="smtp.example.com" 
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port <span className="text-red-500">*</span></Label>
                  <Input 
                    type="number" 
                    placeholder="587" 
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input 
                    placeholder="Optional" 
                    value={smtpUsername}
                    onChange={(e) => setSmtpUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Password</Label>
                    <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Encrypted at rest</span>
                  </div>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"}
                      placeholder="Optional" 
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Label>Encryption</Label>
                <RadioGroup 
                  value={encryptionType} 
                  onValueChange={(v: any) => setEncryptionType(v)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 border rounded-lg px-4 py-2 hover:bg-slate-50 cursor-pointer">
                    <RadioGroupItem value="TLS" id="r-tls" />
                    <Label htmlFor="r-tls" className="cursor-pointer">STARTTLS (Recommended)</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg px-4 py-2 hover:bg-slate-50 cursor-pointer">
                    <RadioGroupItem value="SSL" id="r-ssl" />
                    <Label htmlFor="r-ssl" className="cursor-pointer">SSL/TLS</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg px-4 py-2 hover:bg-slate-50 cursor-pointer opacity-70">
                    <RadioGroupItem value="NONE" id="r-none" />
                    <Label htmlFor="r-none" className="cursor-pointer">None</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-slate-50/50 flex justify-end py-4">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Configuration
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar / Testing Column */}
        <div className="space-y-6">
          {config && (
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-indigo-900 uppercase tracking-wider font-semibold flex items-center gap-2">
                  Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {config.lastTestStatus === 'success' ? (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                    <h4 className="font-medium text-slate-900">Connection Verified</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Last checked {config.lastTestedAt ? new Date(config.lastTestedAt).toLocaleDateString() : 'recently'}
                    </p>
                  </div>
                ) : config.lastTestStatus === 'failed' ? (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <h4 className="font-medium text-slate-900">Connection Failed</h4>
                    <p className="text-xs text-red-600 mt-1 line-clamp-2" title={config.lastTestError || ''}>
                      {config.lastTestError || "Failed to connect to SMTP server"}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500">
                    <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Not tested yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Test Connection</CardTitle>
              <CardDescription className="text-xs">
                Send a test email using the credentials provided on the left (without saving).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Send Test Email To</Label>
                <Input 
                  type="email" 
                  placeholder="your@email.com" 
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                />
              </div>
              <Button 
                variant="secondary" 
                className="w-full gap-2" 
                onClick={handleTest}
                disabled={isTesting || !testRecipient}
              >
                {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Run Test
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
