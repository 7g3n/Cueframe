import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_FILES_BUCKET } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const { versionId } = await params;
  const supabase = await createClient();

  const { data: version, error } = await supabase
    .from("versions")
    .select("file_path")
    .eq("id", versionId)
    .single();

  if (error || !version) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .createSignedUrl(version.file_path, 60);

  if (signError || !signed) {
    return NextResponse.json({ error: "failed to sign" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
