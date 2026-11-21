import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Upload, Link as LinkIcon, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, screenshotsQuery, slugify, type AppRecord } from "@/lib/apps";
import { submissionSchema, imageReferenceSchema, MAX_SCREENSHOTS, MAX_IMAGE_BYTES } from "@/lib/app-submission";
import { uploadAppImage } from "@/lib/app-media.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AppScreenshot } from "./AppScreenshot";

const STEPS = ["App details", "Links", "Description", "Icon", "Screenshots", "Details", "Review"];

export function AppSubmissionForm({ app, admin = false, onClose }: { app: AppRecord | null; admin?: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: cats = [] } = useQuery(categoriesQuery());
  const { data: shots = [], isPending: loadingShots, isError: screenshotsFailed, error: screenshotsError } = useQuery({ ...screenshotsQuery(app?.id ?? ""), enabled: !!app });
  const { data: devs = [] } = useQuery({ queryKey: ["admin", "developers"], enabled: admin, queryFn: async () => (await supabase.from("developers").select("id, name").order("name")).data ?? [] });
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: app?.name ?? "", slug: app?.slug ?? "", short_description: app?.short_description ?? "", description: app?.description ?? "", app_url: app?.app_url ?? "", website_url: app?.website_url ?? "", icon_url: app?.icon_url ?? "", category_id: app?.category_id ?? "", developer_id: app?.developer_id ?? "", author_name: "", version: app?.version ?? "1.0.0", status: app?.status ?? (admin ? "approved" : "submitted"), keywords: (app?.keywords ?? []).join(", "), features: (app?.features ?? []).join("\n") });
  const [screenshots, setScreenshots] = useState<string[] | null>(null);
  const images = screenshots ?? shots.map((s) => s.url);
  const [imageIndex, setImageIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number; percent: number; currentName: string; status: "uploading" | "complete" | "failed" } | null>(null);
  const [error, setError] = useState("");
  const upload = useServerFn(uploadAppImage);
  const set = (key: keyof typeof f) => (e: { target: { value: string } }) => setF((prev) => ({ ...prev, [key]: e.target.value }));
  const row = () => ({ ...f, slug: f.slug.trim() || slugify(f.name), status: f.status, keywords: f.keywords.split(",").map((v) => v.trim()).filter(Boolean), features: f.features.split("\n").map((v) => v.trim()).filter(Boolean) });

  function next() {
    const fields = [["name", "slug", "short_description"], ["app_url", "website_url"], ["description"], ["icon_url"], [], ["version", "keywords", "features"], []][step] ?? [];
    const result = submissionSchema.safeParse(row());
    const issue = !result.success ? result.error.issues.find((i) => fields.includes(String(i.path[0]))) : null;
    if (issue) { setError(`${String(issue.path[0]).replaceAll("_", " ")}: ${issue.message}`); return; }
    if (step === 4 && images.some((url) => !url || !imageReferenceSchema.safeParse(url).success)) { setError("Upload an image or enter a valid HTTPS link for every screenshot."); return; }
    setError(""); setStep((s) => s + 1);
  }
  async function save() {
    const result = submissionSchema.safeParse(row());
    if (!result.success) { setError(result.error.issues[0]?.message ?? "Check app details"); return; }
    setSaving(true); setError("");
    try {
      const { error } = await supabase.rpc("save_app_submission", { payload: result.data, screenshot_urls: images, ...(app ? { app_id: app.id } : {}) });
      if (error) throw error;
      await qc.invalidateQueries();
      toast.success(admin ? "App saved" : "App submitted for admin review");
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String(e.message) : "Could not save app. Please try again."); }
    finally { setSaving(false); }
  }
  async function uploadImage(file: File, icon: boolean) {
    if (!isValidImage(file)) { setError("Choose a PNG, JPEG or WebP image up to 5 MB."); return; }
    setUploading(true); setError("");
    setUploadProgress({ completed: 0, total: 1, percent: 0, currentName: file.name, status: "uploading" });
    try {
      const reference = await uploadFile(file, (percent) => setUploadProgress({ completed: 0, total: 1, percent, currentName: file.name, status: "uploading" }));
      if (icon) setF((p) => ({ ...p, icon_url: reference }));
      else setScreenshots(images.map((s, i) => i === imageIndex ? reference : s));
      setUploadProgress({ completed: 1, total: 1, percent: 100, currentName: file.name, status: "complete" });
    } catch (e) {
      setUploadProgress((current) => ({ completed: 0, total: 1, percent: current?.percent ?? 0, currentName: file.name, status: "failed" }));
      setError(`${file.name}: ${e instanceof Error ? e.message : "Image upload failed"}`);
    }
    finally { setUploading(false); }
  }
  async function uploadScreenshots(files: File[]) {
    const firstFile = files[0];
    if (!firstFile) return;
    if (files.length > MAX_SCREENSHOTS - images.length) {
      setError(`You can add up to ${MAX_SCREENSHOTS} screenshots.`);
      return;
    }
    const invalidFile = files.find((file) => !isValidImage(file));
    if (invalidFile) {
      setError(`${invalidFile.name}: choose a PNG, JPEG or WebP image up to 5 MB.`);
      return;
    }
    setUploading(true); setError("");
    const totalBytes = files.reduce((total, file) => total + file.size, 0);
    let completedBytes = 0;
    let lastFileName = firstFile.name;
    setUploadProgress({ completed: 0, total: files.length, percent: 0, currentName: firstFile.name, status: "uploading" });
    try {
      for (const [index, file] of files.entries()) {
        lastFileName = file.name;
        setUploadProgress((current) => ({ completed: index, total: files.length, percent: current?.percent ?? 0, currentName: file.name, status: "uploading" }));
        try {
          const reference = await uploadFile(file, (filePercent) => {
            const percent = Math.floor(((completedBytes + file.size * filePercent / 100) / totalBytes) * 100);
            setUploadProgress({ completed: index, total: files.length, percent, currentName: file.name, status: "uploading" });
          });
          completedBytes += file.size;
          setScreenshots((current) => [...(current ?? shots.map((shot) => shot.url)), reference]);
          setUploadProgress({ completed: index + 1, total: files.length, percent: Math.floor((completedBytes / totalBytes) * 100), currentName: file.name, status: "uploading" });
        } catch (e) {
          setUploadProgress((current) => ({ completed: index, total: files.length, percent: current?.percent ?? 0, currentName: file.name, status: "failed" }));
          setError(`${file.name}: ${e instanceof Error ? e.message : "Screenshot upload failed"}`);
          return;
        }
      }
      setUploadProgress({ completed: files.length, total: files.length, percent: 100, currentName: lastFileName, status: "complete" });
    } finally { setUploading(false); }
  }
  async function uploadFile(file: File, onProgress: (percent: number) => void) {
    const data = new FormData();
    data.set("image", file);
    return upload({ data, fetch: (input, init) => fetchWithProgress(input, init, onProgress) });
  }
  function imageField(icon: boolean) {
    const value = icon ? f.icon_url : images[imageIndex] ?? "";
    const change = (v: string) => icon ? setF((p) => ({ ...p, icon_url: v })) : setScreenshots(images.map((s, i) => i === imageIndex ? v : s));
    return <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium">
          <Upload className="size-4" />{uploading ? "Uploading…" : icon ? "Upload icon" : "Upload screenshots"}
          <input
            type="file"
            aria-label={icon ? "Upload app icon" : "Upload screenshots"}
            className="sr-only"
            accept="image/png,image/jpeg,image/webp"
            multiple={!icon}
            disabled={uploading || (!icon && images.length >= MAX_SCREENSHOTS)}
            onChange={(e) => {
              const files = Array.from(e.currentTarget.files ?? []);
              if (icon) { if (files[0]) void uploadImage(files[0], true); }
              else void uploadScreenshots(files);
              e.currentTarget.value = "";
            }}
          />
        </label>
        <span className="text-xs text-muted-foreground">PNG, JPEG, WebP · 5 MB</span>
      </div>
      {uploadProgress && <div className="space-y-1.5" aria-live="polite">
        <div className="flex justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate">
            {uploadProgress.status === "failed"
              ? `Upload failed: ${uploadProgress.currentName}`
              : uploadProgress.status === "complete"
                ? `Uploaded ${uploadProgress.total} ${uploadProgress.total === 1 ? "file" : "files"}`
                : `Uploading ${uploadProgress.completed + 1} of ${uploadProgress.total}: ${uploadProgress.currentName}`}
          </span>
          {uploadProgress.status !== "failed" && <span>{uploadProgress.percent}%</span>}
        </div>
        <div role="progressbar" aria-label="Image upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress.percent} className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-[width]" style={{ width: `${uploadProgress.percent}%` }} />
        </div>
      </div>}
      <Field label="Or image URL"><div className="flex items-center gap-2"><LinkIcon className="size-4 shrink-0 text-muted-foreground" /><Input aria-label={icon ? "Icon URL" : "Screenshot URL"} value={value.startsWith("storage://") ? "" : value} placeholder="https://…" maxLength={2048} onChange={(e) => change(e.target.value)} /></div></Field>
      {value && <div className="flex h-24 items-center justify-between gap-3"><AppScreenshot src={value} alt={icon ? "App icon preview" : `Screenshot ${imageIndex + 1}`} className="h-24 max-w-[75%] rounded-md object-contain" /><Button size="icon" variant="ghost" aria-label="Remove image" title="Remove image" onClick={() => change("")}><Trash2 className="size-4" /></Button></div>}
    </div>;
  }
  return <Dialog open onOpenChange={(open) => { if (!open && !saving && !uploading) onClose(); }}>
    <DialogContent className="flex h-[min(520px,calc(100dvh-16px))] w-[calc(100%-16px)] max-w-lg flex-col gap-3 overflow-hidden rounded-lg p-4">
      <DialogHeader className="shrink-0 pr-6 text-left"><DialogTitle>{app ? "Edit app" : admin ? "Add app" : "Submit app"}</DialogTitle><DialogDescription className="text-xs">Tankisol doesn’t list websites with explicit content.</DialogDescription></DialogHeader>
      <div className="shrink-0"><div className="mb-2 flex justify-between text-xs"><span className="font-semibold">{STEPS[step]}</span><span className="text-muted-foreground">{step + 1} / {STEPS.length}</span></div><div className="flex gap-1" aria-label={`Step ${step + 1} of ${STEPS.length}`}>{STEPS.map((s,i) => <span key={s} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />)}</div></div>
      <div className="min-h-0 flex-1 space-y-3">
        {step === 0 && <><Field label="App name"><Input aria-label="App name" value={f.name} maxLength={100} onChange={set("name")} /></Field><Field label="Short description"><Input aria-label="Short description" value={f.short_description} maxLength={200} onChange={set("short_description")} /></Field><Field label="Category"><select aria-label="Category" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={f.category_id} onChange={set("category_id")}><option value="">None</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field></>}
        {step === 1 && <><Field label="App link"><Input aria-label="App link" value={f.app_url} maxLength={2048} placeholder="https://…" onChange={set("app_url")} /></Field><Field label="Website (optional)"><Input aria-label="Website" value={f.website_url} maxLength={2048} placeholder="https://…" onChange={set("website_url")} /></Field><Field label="Web address name (optional)"><Input aria-label="Web address name" value={f.slug} maxLength={100} placeholder={slugify(f.name)} onChange={set("slug")} /></Field></>}
        {step === 2 && <><Field label="Full description"><Textarea aria-label="Full description" className="h-32 resize-none" maxLength={6000} value={f.description} onChange={set("description")} /></Field>{admin ? <Field label="Developer"><select aria-label="Developer" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={f.developer_id} onChange={set("developer_id")}><option value="">None</option>{devs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field> : <Field label="Author name"><Input aria-label="Author name" maxLength={100} value={f.author_name} onChange={set("author_name")} /></Field>}</>}
        {step === 3 && imageField(true)}
        {step === 4 && <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Select up to {MAX_SCREENSHOTS} screenshots at once. PNG, JPEG or WebP · 5 MB each.</p>
          {images.length > 0 && <div className="flex items-center justify-between">
            <span className="text-xs">Screenshot {imageIndex + 1} of {images.length}</span>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" aria-label="Previous screenshot" disabled={imageIndex === 0} onClick={() => setImageIndex((i) => i - 1)}><ArrowLeft className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Next screenshot" disabled={imageIndex >= images.length - 1} onClick={() => setImageIndex((i) => i + 1)}><ArrowRight className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Delete screenshot" onClick={() => { setScreenshots(images.filter((_, i) => i !== imageIndex)); setImageIndex(Math.max(0, imageIndex - 1)); }}><Trash2 className="size-4" /></Button>
            </div>
          </div>}
          {imageField(false)}
          {images.length === 0 && <p className="text-xs text-muted-foreground">No screenshots added yet.</p>}
          {images.length < MAX_SCREENSHOTS && <Button size="sm" variant="outline" disabled={uploading} onClick={() => { setScreenshots([...images, ""]); setImageIndex(images.length); }}><Plus className="size-4" />Add screenshot URL</Button>}
        </div>}
        {step === 5 && <><Field label="Version"><Input aria-label="Version" maxLength={40} value={f.version} onChange={set("version")} /></Field><Field label="Keywords (comma separated)"><Input aria-label="Keywords" maxLength={3000} value={f.keywords} onChange={set("keywords")} /></Field><Field label="Features (one per line)"><Textarea aria-label="Features" className="h-24 resize-none" maxLength={6000} value={f.features} onChange={set("features")} /></Field></>}
        {step === 6 && <><h3 className="truncate font-semibold">{f.name}</h3><p className="line-clamp-2 text-sm text-muted-foreground">{f.short_description}</p><p className="text-xs text-muted-foreground">{images.length} screenshots · {f.icon_url ? "Icon added" : "No icon"}</p><Field label={admin ? "Listing status" : "Submission status"}><select aria-label="Listing status" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={f.status} onChange={set("status")}>{(admin ? ["draft", "submitted", "under_review", "approved", "published", "rejected", "suspended"] : ["draft", "submitted"]).map((s) => <option key={s} value={s}>{s === "published" ? "Listed on store" : s === "submitted" ? "Submit for admin review" : s.replaceAll("_", " ")}</option>)}</select></Field></>}
      </div>
      {screenshotsFailed && <div role="alert" className="flex shrink-0 items-center justify-between gap-2 text-xs text-destructive">
        <span>Could not load existing screenshots: {screenshotsError instanceof Error ? screenshotsError.message : "Please try again."}</span>
        <Button size="sm" variant="outline" onClick={() => void qc.invalidateQueries({ queryKey: ["screenshots", app?.id] })}>Retry</Button>
      </div>}
      {error && <p role="alert" className="shrink-0 text-xs text-destructive">{error}</p>}
      <div className="flex shrink-0 items-center justify-between border-t pt-3"><Button variant="outline" disabled={saving || uploading} onClick={() => { if (step === 0) onClose(); else { setError(""); setStep((s) => s-1); } }}><ArrowLeft className="size-4" />{step === 0 ? "Cancel" : "Back"}</Button>{step < STEPS.length-1 ? <Button onClick={next} disabled={uploading || (!!app && (loadingShots || screenshotsFailed))}>Next<ArrowRight className="size-4" /></Button> : <Button onClick={save} disabled={saving || uploading || (!!app && (loadingShots || screenshotsFailed))}>{saving ? "Saving…" : admin ? "Save app" : f.status === "draft" ? "Save draft" : "Submit app"}</Button>}</div>
    </DialogContent>
  </Dialog>;
}
function isValidImage(file: File) {
  return file.size > 0 && file.size <= MAX_IMAGE_BYTES && ["image/png", "image/jpeg", "image/webp"].includes(file.type);
}
async function fetchWithProgress(input: RequestInfo | URL, init: RequestInit | undefined, onProgress: (percent: number) => void): Promise<Response> {
  const request = new Request(input, init);
  const body = await request.arrayBuffer();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(request.method, request.url);
    request.headers.forEach((value, key) => xhr.setRequestHeader(key, value));
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.min(99, Math.floor((event.loaded / event.total) * 100)));
    });
    xhr.addEventListener("load", () => {
      const headers = new Headers();
      xhr.getAllResponseHeaders().trim().split(/[\r\n]+/).filter(Boolean).forEach((line) => {
        const separator = line.indexOf(":");
        if (separator > 0) headers.append(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
      });
      resolve(new Response(xhr.responseText, { status: xhr.status, statusText: xhr.statusText, headers }));
    });
    xhr.addEventListener("error", () => reject(new TypeError("Network error while uploading image")));
    xhr.addEventListener("abort", () => reject(new DOMException("Image upload aborted", "AbortError")));
    request.signal.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(body);
  });
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>; }