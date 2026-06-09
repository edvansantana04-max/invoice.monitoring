import { withAuth } from "next-auth/middleware";

export default withAuth(() => undefined, {
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
