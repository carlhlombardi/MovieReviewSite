import { Montserrat } from "next/font/google";

import NavbarComponent from "@/app/components/navbar/Navbar.jsx";
import Footer from "@/app/components/footer/Footer.jsx";
import { AuthProvider } from '@/app/(auth)/context/AuthContext';
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
      <AuthProvider>
        <div className="container">
        <NavbarComponent />
        {children}
        <Footer /> 
        </div>
        </AuthProvider>
      </body>
    </html>
  );
}