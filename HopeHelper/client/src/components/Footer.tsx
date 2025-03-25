export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 py-4 mt-auto">
      <div className="container mx-auto px-4 text-center text-sm text-neutral-500">
        <p>© {new Date().getFullYear()} HopeBot. This is a support tool and not a substitute for professional mental health advice.</p>
        <div className="mt-2 flex justify-center space-x-4">
          <a href="#" className="hover:text-primary">Privacy Policy</a>
          <a href="#" className="hover:text-primary">Terms of Service</a>
          <a href="#" className="hover:text-primary">Contact Us</a>
        </div>
      </div>
    </footer>
  );
}
