import { Link } from "@tanstack/react-router"
import { AppLayout } from "@/components/app-layout"

const CONTACT_EMAIL = "info@trovebox.io"

function ContactEmail() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="text-primary underline underline-offset-4"
    >
      {CONTACT_EMAIL}
    </a>
  )
}

function PrivacyPolicyLink() {
  return (
    <Link
      to="/privacy-policy"
      className="text-primary underline underline-offset-4"
    >
      Privacy Policy
    </Link>
  )
}

export function TermsOfUsePage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold">Terms of Use</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Last updated: September 10, 2026
        </p>

        <div className="prose prose-neutral dark:prose-invert space-y-6 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              1. Agreement to These Terms
            </h2>
            <p>
              These Terms of Use ("Terms") are an agreement between you and AG
              Technology Group LLC ("we", "our", "us"). They govern your use of
              Trove, the collection-cataloging service we operate at trovebox.io
              (the "Service").
            </p>
            <p>
              By creating an account, signing in, or otherwise using the
              Service, you agree to these Terms. Our <PrivacyPolicyLink />{" "}
              explains how we handle your information. If you don't agree to
              these Terms, don't use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">2. Who Can Use Trove</h2>
            <p>
              You must be at least 18 years old to use the Service, or the age
              of majority where you live if that is higher. By using the
              Service, you confirm that you meet this requirement. If we learn
              that an account belongs to someone who doesn't, we may close it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">3. Your Account</h2>
            <p>
              You can create an account with an email address and password, or
              sign in with Google. Give us accurate information and keep your
              password secure. You're responsible for everything that happens
              under your account. If you think someone has accessed it without
              your permission, contact us right away at <ContactEmail />.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">4. Your Content</h2>
            <p>
              <strong>You own it.</strong> Everything you add to Trove — item
              records, descriptions, values, notes, provenance, and photos
              ("Your Content") — stays yours.
            </p>
            <p>
              <strong>The license you give us.</strong> To run the Service, we
              need your permission to handle Your Content. You grant us a
              worldwide, non-exclusive, royalty-free license to host, store,
              copy, process, and display Your Content, including making
              technical changes such as resizing or re-encoding images. We use
              this license only to provide the Service to you. It ends when you
              delete Your Content or your account, except for copies that remain
              in backups for a limited period or that the law requires us to
              keep.
            </p>
            <p>
              <strong>It's private to you.</strong> Your collections aren't
              shown to other users or published. We don't sell Your Content or
              use it for advertising. We access it only when needed to operate,
              support, or secure the Service, or when the law requires.
            </p>
            <p>
              <strong>Photos are served by link.</strong> Uploaded photos are
              stored at unlisted web addresses. Those links aren't published or
              discoverable through the Service, but anyone who has a photo's
              exact link can view it.
            </p>
            <p>
              <strong>You're responsible for it.</strong> Only upload content
              you have the right to use — generally, photos you took yourself or
              have permission to use.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">5. Acceptable Use</h2>
            <p>When using the Service, don't:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>break the law, or store unlawful material;</li>
              <li>
                upload content that infringes someone else's rights or contains
                malware;
              </li>
              <li>access, or try to access, another user's account or data;</li>
              <li>
                probe or test the Service for vulnerabilities without our
                permission (report suspected vulnerabilities to <ContactEmail />{" "}
                instead), or bypass its security measures or usage limits, such
                as rate and upload limits;
              </li>
              <li>
                disrupt or overload the Service or the infrastructure it runs
                on;
              </li>
              <li>
                use bots, scrapers, or other automated means to access the
                Service, except through interfaces we provide for that purpose.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              6. Values and Details Are Yours to Verify
            </h2>
            <p>
              Trove is a record-keeping tool. Estimated values, prices,
              attributions, dates, provenance, and other details, and any totals
              calculated from them, reflect what you enter. We don't appraise,
              authenticate, verify, or insure anything, and nothing in the
              Service is appraisal, financial, tax, legal, or insurance advice.
              Before relying on a record for an insurance claim, sale, tax
              filing, or estate matter, consult a qualified professional.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              7. Open Source, Trademarks, and Feedback
            </h2>
            <p>
              The source code for Trove's web app and API is published under the
              Apache License 2.0. That license governs your use of the code.
              These Terms govern your use of the Service we operate at
              trovebox.io. The Trove name and logo aren't licensed under Apache
              2.0: don't use them in a way that suggests we endorse, sponsor, or
              are affiliated with anything without our permission.
            </p>
            <p>
              If you send us feedback or suggestions, we may use them without
              any obligation to you.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">8. Third-Party Services</h2>
            <p>
              The Service relies on third-party providers, including for
              hosting, image storage, sign-in, error monitoring, and analytics.
              Our <PrivacyPolicyLink /> lists them and describes what they
              receive. If you sign in with Google, Google's terms also apply to
              your Google account. We aren't responsible for third-party
              services we don't control.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              9. Availability and Changes to the Service
            </h2>
            <p>
              We work to keep Trove available and your data safe, but we can't
              promise the Service will be uninterrupted or error-free, or that
              data will never be lost.{" "}
              <strong>
                Keep your own copies of any photos and records you can't afford
                to lose.
              </strong>
            </p>
            <p>
              We may change, suspend, or discontinue any part of the Service. If
              we decide to shut the Service down, we'll try to give you
              reasonable advance notice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">10. Ending Your Use</h2>
            <p>
              You can stop using the Service at any time. To delete your account
              and its data, contact us at <ContactEmail />. We'll handle your
              request as described in our <PrivacyPolicyLink />.
            </p>
            <p>
              We may suspend or close your account if you violate these Terms,
              if the law requires it, or if it's needed to protect the Service
              or other users. Where reasonable, we'll tell you why first.
            </p>
            <p>
              Sections 6, 7, 11 through 14, and 16 continue to apply after your
              account ends.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">11. Disclaimers</h2>
            <p>
              <strong>
                The Service is provided "as is" and "as available." To the
                fullest extent permitted by law, we disclaim all warranties,
                express or implied, including warranties of merchantability,
                fitness for a particular purpose, title, and non-infringement,
                and any warranty that the Service will be uninterrupted, secure,
                or error-free, or that data will not be lost.
              </strong>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              12. Limitation of Liability
            </h2>
            <p>
              <strong>
                To the fullest extent permitted by law, we won't be liable for
                any indirect, incidental, special, consequential, or punitive
                damages, or for any loss of data, profits, or goodwill, arising
                out of or relating to the Service or these Terms, even if we've
                been told such damages were possible. Our total liability for
                all claims relating to the Service is limited to the greater of
                US$100 or the amount you paid us for the Service in the 12
                months before the claim arose.
              </strong>
            </p>
            <p>
              Some jurisdictions don't allow some of these exclusions or limits,
              so they may not all apply to you. Nothing in these Terms limits
              liability that can't be limited by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">13. Indemnity</h2>
            <p>
              To the extent permitted by law, you agree to indemnify and hold us
              harmless from claims, losses, and expenses, including reasonable
              legal fees, arising from Your Content or from your violation of
              these Terms or the law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              14. Governing Law and Disputes
            </h2>
            <p>
              These Terms are governed by the laws of the State of Texas, USA,
              without regard to its conflict-of-law rules. Any dispute relating
              to these Terms or the Service will be resolved in the state or
              federal courts located in Harris County, Texas, and you and we
              consent to their jurisdiction. Either of us may instead bring a
              claim in small-claims court if it qualifies. If the
              consumer-protection laws where you live give you the right to
              bring claims in your local courts or under your local law, these
              Terms don't take that right away.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              15. Changes to These Terms
            </h2>
            <p>
              We may update these Terms from time to time. The date at the top
              shows when they last changed. If a change is material, we'll take
              reasonable steps to tell you before it takes effect, such as a
              notice in the app or an email. If you keep using the Service after
              a change takes effect, you accept the updated Terms. If you don't
              accept them, stop using the Service and ask us to delete your
              account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">16. General</h2>
            <p>
              These Terms, together with our <PrivacyPolicyLink />, are the
              entire agreement between you and us about the Service. If any part
              of these Terms is found unenforceable, the rest stays in effect.
              If we don't enforce a provision, that isn't a waiver of it. You
              may not transfer your rights under these Terms without our
              consent. We may transfer ours to an affiliate, as part of a
              merger, acquisition, or sale of assets, or by operation of law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">17. Contact</h2>
            <p>
              Questions about these Terms, account deletion requests, and
              security reports: <ContactEmail />.
            </p>
          </section>
        </div>
      </div>
    </AppLayout>
  )
}
