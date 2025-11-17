export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/settings/:path*", 
    "/team/:path*", 
    "/projects/:path*",
    "/products/:path*",  // Protect products routes
  ],
};
