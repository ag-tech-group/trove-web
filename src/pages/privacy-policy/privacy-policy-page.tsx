import { Link } from "@tanstack/react-router"

export function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Last updated: January 30, 2026
      </p>

      <div className="prose prose-neutral dark:prose-invert space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold">1. Introduction</h2>
          <p>
            Trove ("we", "our", "us") is a personal collection management
            application. This Privacy Policy explains how we collect, use, and
            protect your information when you use our service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Information We Collect</h2>
          <p>
            <strong>Account information:</strong> When you create an account, we
            collect your email address and a password. If you sign in with
            Google, we receive your name, email address, and Google account ID
            from Google. We do not receive or store your Google password.
          </p>
          <p>
            <strong>Collection data:</strong> Information you add to your
            collections, including item names, descriptions, images, and any
            other details you choose to provide.
          </p>
          <p>
            <strong>Usage data:</strong> We collect basic server logs (IP
            address, browser type, timestamps) for security and to maintain the
            service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            3. How We Use Your Information
          </h2>
          <p>We use your information to:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Provide and maintain the Trove service</li>
            <li>Authenticate your identity and secure your account</li>
            <li>Respond to support requests</li>
          </ul>
          <p>
            We do not sell your personal information. We do not use your data
            for advertising.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Google OAuth</h2>
          <p>
            If you choose to sign in with Google, we request access to your
            basic profile information (name and email address) through Google's
            OAuth 2.0 service. This is used solely to create and authenticate
            your Trove account. We do not access your Google contacts, calendar,
            files, or any other Google services.
          </p>
          <p>
            Our use of information received from Google APIs adheres to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            5. Data Storage and Security
          </h2>
          <p>
            Your data is stored securely using encrypted connections (TLS).
            Passwords are hashed using industry-standard algorithms and are
            never stored in plain text. We take reasonable measures to protect
            your information from unauthorized access, alteration, or
            destruction.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            6. Data Retention and Deletion
          </h2>
          <p>
            We retain your data for as long as your account is active. You may
            request deletion of your account and all associated data by
            contacting us. Upon deletion, your data will be permanently removed
            from our systems.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Google OAuth:</strong> For optional sign-in authentication
            </li>
            <li>
              <strong>Railway:</strong> For hosting our backend and database
            </li>
            <li>
              <strong>Netlify:</strong> For hosting our frontend application
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            users of significant changes by posting a notice within the
            application.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">9. Contact</h2>
          <p>
            If you have questions about this Privacy Policy or your data, please
            contact us through the application.
          </p>
        </section>
      </div>

      <div className="mt-8">
        <Link
          to="/login"
          className="text-primary text-sm underline underline-offset-4"
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}
