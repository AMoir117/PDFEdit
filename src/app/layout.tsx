import "../utils/polyfills";
import "./globals.css";


export const metadata = {
  title: 'PDFEdit.com',
  description: 'Free online PDF editor. Upload and edit PDF files directly in your browser.',
  authors: [{ name: 'Andrew M' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col" id="root">
        {children}
      </body>
    </html>
  );
}
