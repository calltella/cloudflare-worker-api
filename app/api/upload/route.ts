// app/api/upload/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/auth";
import { uploadFileToR2, deleteR2Object } from "@/lib/r2";
import { UPLOAD_FOLDERS, type UploadFolder } from "@/lib/r2/types";
import { R2_BUCKET_TYPES, type BucketType, } from "@/lib/r2/constants";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const PUBLIC_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const PRIVATE_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

export async function POST(
  request: NextRequest
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    console.log(request.headers.get("content-type"));
    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }

    // file
    const fileRaw = formData.get("file");
    console.log(fileRaw);
    console.log(fileRaw instanceof File);

    if (!(fileRaw instanceof File)) {
      return NextResponse.json(
        { message: "file is required", }, { status: 400, }
      );
    }

    const file = fileRaw;

    // bucket type
    const bucketTypeRaw = formData.get("bucketType");

    if (bucketTypeRaw !== R2_BUCKET_TYPES.PUBLIC && bucketTypeRaw !== R2_BUCKET_TYPES.PRIVATE) {
      return NextResponse.json(
        { message: "invalid bucket type", }, { status: 400, }
      );
    }

    const bucketType: BucketType = bucketTypeRaw;

    function isUploadFolder(value: unknown): value is UploadFolder {
      return UPLOAD_FOLDERS.includes(value as UploadFolder);
    }

    const folderRaw = formData.get("folder");

    if (!isUploadFolder(folderRaw)) {
      return NextResponse.json(
        { message: "invalid folder type" },
        { status: 400 }
      );
    }
    const folder: UploadFolder = folderRaw;

    // size validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "file size too large", }, { status: 400, }
      );
    }

    // mime validation
    const allowedMimeTypes = bucketType === R2_BUCKET_TYPES.PUBLIC ? PUBLIC_MIME_TYPES : PRIVATE_MIME_TYPES;

    if (!allowedMimeTypes.includes(file.type)
    ) {
      console.log(`upload file.type: ${JSON.stringify(file.type)}`)
      return NextResponse.json(
        { message: "invalid file type", }, { status: 400, }
      );
    }

    // upload
    const result = await uploadFileToR2({ file, bucketType, userId: auth.user.sub, folder: folder });

    return NextResponse.json({
      success: true,
      file: { key: result.key, fileName: result.fileName, url: result.url, },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "upload failed", }, { status: 500, }
    );
  }
}

/**
 * DELETE
 */
export async function DELETE(
  request: NextRequest
) {
  const auth = await requireAuth(request);

  if (!auth.ok) { return auth.response; }

  try {
    const body =
      await request.json();

    const key = body.key;

    const bucketType =
      body.bucketType;

    if (typeof key !== "string"
    ) {
      return NextResponse.json(
        { message: "key is required", }, { status: 400, }
      );
    }

    if (
      bucketType !== R2_BUCKET_TYPES.PUBLIC && bucketType !== R2_BUCKET_TYPES.PRIVATE
    ) {
      return NextResponse.json(
        { message: "invalid bucket type", }, { status: 400, }
      );
    }

    await deleteR2Object(
      key,
      bucketType
    );

    return NextResponse.json({
      success: true,
      deleted: key,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "delete failed", }, { status: 500, }
    );
  }
}