import Link from 'next/link';

export function Footer() {
  return (
    <footer>
      {/* Main Footer */}
      <div className="bg-[var(--dark-2)] py-12">
        <div className="mx-auto grid w-full max-w-[1170px] grid-cols-1 gap-10 px-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
              About AmCart
            </h5>
            <p className="text-xs leading-relaxed text-gray-500">
              AmCart is your one-stop destination for fashion, electronics, and lifestyle products.
              We deliver quality products with a seamless shopping experience powered by modern technology.
            </p>
          </div>

          {/* Information */}
          <div>
            <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
              Information
            </h5>
            <ul className="space-y-2">
              {['Bestsellers', 'New Products', 'Special Offers', 'Featured', 'Contact Us'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-xs text-gray-500 hover:text-[var(--gold)] transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* My Account */}
          <div>
            <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
              My Account
            </h5>
            <ul className="space-y-2">
              {[
                { label: 'My Account', href: '/dashboard' },
                { label: 'Wishlist', href: '#' },
                { label: 'Order History', href: '#' },
                { label: 'Track Order', href: '#' },
                { label: 'Returns', href: '#' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-xs text-gray-500 hover:text-[var(--gold)] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
              Contact Info
            </h5>
            <ul className="space-y-2 text-xs text-gray-500">
              <li>AmCart, Bengaluru, India</li>
              <li><a href="tel:+918001234567" className="hover:text-[var(--gold)] transition-colors">+91 800-123-4567</a></li>
              <li><a href="mailto:support@amcart.store" className="hover:text-[var(--gold)] transition-colors">support@amcart.store</a></li>
              <li><a href="#" className="hover:text-[var(--gold)] transition-colors">www.amcart.store</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[var(--dark)] py-4">
        <div className="mx-auto flex w-full max-w-[1170px] flex-col items-center justify-between gap-3 px-4 sm:flex-row">
          <p className="text-xs text-gray-600">
            © 2026 <Link href="/" className="text-[var(--gold)] hover:text-[var(--gold-dark)]">AmCart</Link>. All rights reserved.
          </p>
          <div className="flex gap-2">
            {[
              { label: 'f', bg: 'bg-[#3b5998]' },
              { label: 't', bg: 'bg-[#55acee]' },
              { label: '▶', bg: 'bg-[#cd201f]' },
              { label: '◉', bg: 'bg-[#e1306c]' },
            ].map((s) => (
              <a
                key={s.label}
                href="#"
                className={`${s.bg} flex h-7 w-7 items-center justify-center text-[11px] text-white hover:opacity-80 transition-opacity`}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}