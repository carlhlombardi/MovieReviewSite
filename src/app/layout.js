import { Montserrat } from "next/font/google";

import NavbarComponent from "@/app/components/navbar/Navbar.jsx";
import Footer from "@/app/components/footer/Footer.jsx";
import { AuthContext } from '@/app/(auth)/auth/auth';

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
          <AuthContext>
        <NavbarComponent />
        {children}
        <Footer />
        </AuthContext>
        </div>
      </body>
    </html>
  );
}