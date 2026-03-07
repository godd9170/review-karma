import "./globals.css";

export const metadata = {
  title: "Review Karma",
  description: "PR review queue with retro pixel-art aesthetics",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
