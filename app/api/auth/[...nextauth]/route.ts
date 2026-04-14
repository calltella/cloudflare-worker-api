// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth.config";

export const { GET, POST } = handlers;

// authjs v5 で必須ではないが
// app/api/auth/[...nextauth]/route.ts

// 補足：完全に不要ではない
//OAuthコールバックなどのために
//内部的には /api/auth/* は必要]
