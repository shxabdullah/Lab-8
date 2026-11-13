import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
} from "@/app/chatgpt-auth";

export async function GET() {
  const user = await getChatGPTUser();
  return Response.json({
    user: user
      ? { id: user.userId, name: user.displayName, email: user.email }
      : null,
    signInUrl: chatGPTSignInPath("/store.html"),
    signOutUrl: chatGPTSignOutPath("/store.html"),
  });
}
