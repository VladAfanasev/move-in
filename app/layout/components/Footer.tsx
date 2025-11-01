import { Home, Mail, MapPin, Phone } from "lucide-react"
import Link from "next/link"

const Footer: React.FC = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Home className="h-8 w-8 text-primary" />
              <span className="font-bold text-2xl">MoveIn</span>
            </div>
            <p className="max-w-xs text-secondary-foreground/70">
              Connecting people to find their perfect home through collaborative buying groups.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-lg">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-secondary-foreground/70 transition-colors hover:text-secondary-foreground"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/properties"
                  className="text-secondary-foreground/70 transition-colors hover:text-secondary-foreground"
                >
                  Properties
                </Link>
              </li>
              <li>
                <Link href="/groups" className="text-gray-400 transition-colors hover:text-white">
                  Buying Groups
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 transition-colors hover:text-white">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-lg">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-gray-400 transition-colors hover:text-white">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 transition-colors hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 transition-colors hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 transition-colors hover:text-white">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-lg">Contact Info</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-secondary-foreground/70">
                <Mail className="h-4 w-4" />
                <span>hello@movein.com</span>
              </li>
              <li className="flex items-center space-x-2 text-secondary-foreground/70">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-2 text-secondary-foreground/70">
                <MapPin className="h-4 w-4" />
                <span>San Francisco, CA</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-secondary-foreground/20 border-t pt-8 text-center text-secondary-foreground/70">
          <p>&copy; 2024 MoveIn. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
