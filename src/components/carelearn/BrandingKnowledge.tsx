import { Card } from "@/components/ui/card";
import { Palette, FileText, Users, AlertCircle, Building2 } from "lucide-react";

export function BrandingKnowledge() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Building2 size={28} className="text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Branding & Knowledge</h2>
          <p className="text-muted-foreground">Company branding and organizational information</p>
        </div>
      </div>

      {/* Feature Not Available Notice */}
      <Card className="p-6 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-orange-600 dark:text-orange-400" size={24} />
          <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100">
            Feature Not Available in Local Mode
          </h3>
        </div>
        <p className="text-orange-800 dark:text-orange-200 mb-4">
          The Branding & Knowledge management feature requires cloud storage and is not available 
          when using the local Docker database setup. This feature was designed to work with 
          external cloud services for file storage and management.
        </p>
        <div className="space-y-3">
          <h4 className="font-medium text-orange-900 dark:text-orange-100">
            Originally included features:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <Palette size={16} />
              <span className="text-sm">Brand Colors Management</span>
            </div>
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <FileText size={16} />
              <span className="text-sm">Document Assets</span>
            </div>
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <Users size={16} />
              <span className="text-sm">Key Contacts</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Setup Card */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 size={18} />
          Training Platform Information
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Platform Name</label>
              <p className="text-foreground font-medium">CareLearn Training Platform</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Version</label>
              <p className="text-foreground font-medium">Local Docker Setup</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Database</label>
              <p className="text-foreground font-medium">PostgreSQL (Docker)</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">API Backend</label>
              <p className="text-foreground font-medium">Node.js/Express</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This training platform is running in local mode with a Docker database. 
              All training content and user data is stored locally on your system.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}