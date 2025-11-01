import { Footer, Header } from "@/app/layout/index"

const storeFrontLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <Header />
      {children}
      <Footer />
    </div>
  )
}
export default storeFrontLayout
