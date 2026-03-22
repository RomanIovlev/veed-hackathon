import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles, Building2, Palette, FileText, Users, Upload, Plus, Edit } from "lucide-react";

interface BrandColor {
  id: string;
  name: string;
  value: string;
}

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string;
}

export function BrandingKnowledge() {
  const [companyName, setCompanyName] = useState("Sunrise Elder Care");
  const [website, setWebsite] = useState("https://sunrise-eldercare.nl");
  const [description, setDescription] = useState("Sunrise Elder Care is a leading provider of compassionate elderly care services across the Netherlands. We believe in dignity, respect, and personalised care for every resident.");
  const [toneOfVoice, setToneOfVoice] = useState("Professional, warm, and empathetic. Avoid clinical jargon. Use inclusive language.");
  
  const [brandColors, setBrandColors] = useState<BrandColor[]>([
    { id: '1', name: 'Primary Teal', value: '#10B981' },
    { id: '2', name: 'Deep Navy', value: '#1E293B' },
    { id: '3', name: 'Warm Grey', value: '#64748B' },
    { id: '4', name: 'Alert Red', value: '#EF4444' }
  ]);

  const [documents, setDocuments] = useState<FileItem[]>([]);
  const [avatars, setAvatars] = useState<string[]>([
    'https://miro.medium.com/v2/resize:fit:3840/format:webp/1*zCw9YQICYZzozYZsqeIiYA.png',
    'https://static.wikia.nocookie.net/angelsandasses/images/b/b1/Lisa_Edelstein.jpg/revision/latest?cb=20100726212055',
    'https://i.namu.wiki/i/pfQI_YQJjWbOsOPPuY08xJuC3AJ2u3RMVelZl8odCGEwEK7_zk0arCvS585VQWtKUqHamP9qWVUehTgG28rCOOGfR6lsQq4aj5cxIVMig1mhdbrAi7RvCYybYRueNqbyL96ReNnEpUbgoEQv-gzFOqiG4FRDxHDO2xM87_uvkLk.webp'
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const addColor = () => {
    const newColor: BrandColor = {
      id: Date.now().toString(),
      name: 'New Color',
      value: '#000000'
    };
    setBrandColors([...brandColors, newColor]);
  };

  const updateColor = (id: string, updates: Partial<BrandColor>) => {
    setBrandColors(brandColors.map(color => 
      color.id === id ? { ...color, ...updates } : color
    ));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const newFile: FileItem = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          type: file.type,
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`
        };
        setDocuments(prev => [...prev, newFile]);
      });
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const url = URL.createObjectURL(file);
        setAvatars(prev => [...prev, url]);
      });
    }
  };

  return (
    <div className="space-y-6 p-6">

      {/* AI-Powered Content Personalisation */}
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Sparkles className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900 mb-2">AI-Powered Content Personalisation</h3>
            <p className="text-green-800">
              Upload your brand assets, documents, and guidelines here. Our AI will use this knowledge base to generate personalised training content, 
              quizzes, and communications that match your organisation's voice and style.
            </p>
          </div>
        </div>
      </Card>

      {/* Company Profile */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-semibold">Company Profile</h2>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-400 text-sm">🌐</span>
                </div>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Company Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 min-h-[100px]"
            />
            <div className="flex justify-end mt-1">
              <Edit className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <Label htmlFor="toneOfVoice">Tone of Voice</Label>
            <Textarea
              id="toneOfVoice"
              value={toneOfVoice}
              onChange={(e) => setToneOfVoice(e.target.value)}
              className="mt-1 min-h-[80px]"
            />
            <p className="text-sm text-gray-500 mt-1">
              This guides AI when generating training content, quiz questions, and staff communications.
            </p>
            <div className="flex justify-end mt-1">
              <Edit className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </Card>

      {/* Brand Colors */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Palette className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-semibold">Brand Colors</h2>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {brandColors.map((color) => (
              <div key={color.id} className="flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-full border-2 border-gray-200 cursor-pointer"
                  style={{ backgroundColor: color.value }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'color';
                    input.value = color.value;
                    input.onchange = (e) => updateColor(color.id, { value: (e.target as HTMLInputElement).value });
                    input.click();
                  }}
                />
                <input
                  type="text"
                  value={color.name}
                  onChange={(e) => updateColor(color.id, { name: e.target.value })}
                  className="mt-1 text-xs text-center border-0 bg-transparent w-20"
                />
                <span className="text-xs text-gray-500">{color.value}</span>
              </div>
            ))}
            <button
              onClick={addColor}
              className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              <Plus className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
      </Card>

      {/* Documents & Assets */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold">Documents & Assets</h2>
          </div>
          <span className="text-sm text-gray-500">{documents.length} files</span>
        </div>

        <div className="space-y-4">
          {/* Upload Area */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 hover:bg-green-50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-1">Drag & drop files here</p>
            <p className="text-sm text-gray-500">PDFs, images, brand guides</p>
            <Button variant="secondary" className="mt-3">
              Browse
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* File List */}
          {documents.length > 0 && (
            <div className="space-y-2">
              {documents.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">{file.size}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Avatars */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold">Avatars</h2>
          </div>
          <span className="text-sm text-gray-500">{avatars.length} files</span>
        </div>

        <p className="text-gray-600 mb-4">
          Upload photos or videos of doctor personas. These professional avatars will be used to generate realistic training images and videos featuring medical experts.
        </p>

        <div className="space-y-4">
          {/* Upload Area */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 hover:bg-green-50 transition-colors cursor-pointer"
            onClick={() => avatarInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-1">Drag & drop photos or videos here</p>
            <p className="text-sm text-gray-500">JPG, PNG, MP4, MOV</p>
            <Button variant="secondary" className="mt-3">
              Browse
            </Button>
          </div>

          <input
            ref={avatarInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />

          {/* Doctor Personas Grid */}
          <div className="grid grid-cols-3 gap-4">
            {avatars.map((avatar, index) => {
              const doctorNames = ["Dr. House", "Dr. Lisa Cuddy", "Dr. Eric Foreman"];
              const specialties = ["Diagnostician", "Endocrinologist", "Neurologist"];
              
              return (
                <div key={index} className="text-center">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                    <img
                      src={avatar}
                      alt={doctorNames[index]}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to a solid color background if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.style.backgroundColor = `hsl(${index * 120}, 50%, 85%)`;
                        target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-600 text-sm">Doctor ${index + 1}</div>`;
                      }}
                    />
                  </div>
                  <p className="font-medium text-sm">{doctorNames[index]}</p>
                  <p className="text-xs text-gray-500">{specialties[index]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}