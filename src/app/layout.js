import { Montserrat } from "next/font/google";

import NavbarComponent from "@/app/components/navbar/Navbar.jsx";
import Footer from "@/app/components/footer/Footer.jsx";
import { AuthProvider } from '@/app/(auth)/contexts/AuthContext';
import  "bootstrap/dist/css/bootstrap.min.css"
import "./globals.css";

const inter = Montserrat ({ subsets: ["latin"] });

export const metadata = {
  title: "Reel Film Reviews",
  description: "Film Reviews with a Jersey Attitude",
};

export default function RootLayout ({ children }) {
  return (
    <html lang= "en">
      <body className={inter.className}>
        <div className="container">
        <AuthProvider>
        <NavbarComponent />
        {children}
        <Footer />
        </AuthProvider>
        </div>
      </body>
    </html>
  );
}