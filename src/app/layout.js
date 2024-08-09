import { Montserrat } from "next/font/google";

import NavbarComponent from "@/app/components/navbar/Navbar.jsx";
import Footer from "@/app/components/footer/Footer.jsx";

import  "bootstrap/dist/css/bootstrap.min.css"
import "./globals.css";

const inter = Montserrat ({ subsets: ["latin"] });

export const metadata = {
  title: "Carl's Untitled Movie Review Site",
  description: "A Website That Will Review All Movies",
};

export default function RootLayout ({ children }) {
  return (
    <html lang= "en">
      <body className={inter.className}>
        <div className="container">
        <NavbarComponent />
        {children}
        <Footer />
        </div>
      </body>
    </html>
  );
}