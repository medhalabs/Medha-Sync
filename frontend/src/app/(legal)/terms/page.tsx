import type { Metadata } from "next";
import Link from "next/link";
import { Updated, H2, P, UL } from "../legal-ui";

export const metadata: Metadata = {
  title: "Terms of Service — Medha Sync",
};

export default function TermsOfServicePage() {
  return (
    <article>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Terms of Service</h1>
      <Updated date="July 1, 2026" />

      <P>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of Medha Sync (the
        &quot;Service&quot;), provided by Medha Labs (&quot;Medha Labs,&quot; &quot;we,&quot; &quot;us,&quot; or
        &quot;our&quot;), a software development studio based in India operating{" "}
        <a href="https://medhalabs.in" className="text-indigo-600 hover:underline">https://medhalabs.in</a>.
        By creating an account or using the Service, you agree to these Terms.
      </P>
      <P>If you do not agree to these Terms, do not use the Service.</P>

      <H2>1. The Service</H2>
      <P>
        Medha Sync is a unified inbox and customer communication platform that lets you connect email
        accounts (Gmail, Outlook, or other IMAP/SMTP providers) and WhatsApp Business numbers to send and
        receive messages, manage contacts, run broadcast campaigns, build automations, and view analytics
        in one place.
      </P>

      <H2>2. Eligibility and accounts</H2>
      <UL>
        <li>You must be at least 18 years old and able to form a binding contract to use the Service.</li>
        <li>You must provide accurate registration information and keep your login credentials confidential. You are responsible for all activity under your account.</li>
        <li>You must have the legal right to connect any email account, phone number, or WhatsApp Business number you link to the Service, and authority to grant Medha Sync the permissions requested during connection.</li>
      </UL>

      <H2>3. Acceptable use</H2>
      <P>You agree not to use the Service to:</P>
      <UL>
        <li>Send unsolicited bulk email (&quot;spam&quot;) or messages to recipients who have not consented to receive them</li>
        <li>Send content that is unlawful, defamatory, fraudulent, or infringes third-party rights</li>
        <li>
          Violate the terms, policies, or acceptable-use rules of any connected third-party platform,
          including Google&apos;s{" "}
          <a href="https://cloud.google.com/terms/agreement" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Acceptable Use Policy</a>
          {" "}and{" "}
          <a href="https://developers.google.com/gmail/api/policy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Gmail Program Policies</a>,
          Microsoft&apos;s terms, and Meta&apos;s{" "}
          <a href="https://business.whatsapp.com/policy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">WhatsApp Business Policy</a>
        </li>
        <li>Attempt to gain unauthorized access to the Service, other users&apos; accounts, or connected third-party accounts</li>
        <li>Reverse-engineer, resell, or use the Service to build a competing product</li>
      </UL>
      <P>
        You are solely responsible for obtaining consent from your contacts before messaging them through
        the Service, and for complying with applicable anti-spam, data protection, and telecommunications
        laws in your jurisdiction.
      </P>

      <H2>4. Third-party integrations</H2>
      <P>
        The Service integrates with Google, Microsoft, and Meta APIs to send and receive messages on your
        behalf. Your use of these integrations is also subject to the respective third party&apos;s terms
        and privacy policies. Medha Labs is not responsible for the availability, security, or acts of
        these third-party providers, and access may be affected by changes to their APIs or policies
        outside our control.
      </P>

      <H2>5. Fees</H2>
      <P>
        The Service is currently provided free of charge. We may introduce paid plans or usage-based fees
        in the future. If we do, we will provide advance notice, and continued use of paid features after
        that date constitutes acceptance of the applicable fees and billing terms, which will be presented
        at that time.
      </P>

      <H2>6. Intellectual property</H2>
      <P>
        Medha Labs retains all rights, title, and interest in the Service, including its software, design,
        and branding. You retain ownership of the content and data you submit through the Service (&quot;Your
        Content&quot;), and you grant Medha Labs a limited license to process Your Content solely to provide
        the Service to you.
      </P>

      <H2>7. Privacy</H2>
      <P>
        Our collection and use of personal information, including Google user data, is described in our{" "}
        <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>, which is
        incorporated into these Terms by reference.
      </P>

      <H2>8. Termination</H2>
      <P>
        You may stop using the Service and delete your account at any time by contacting{" "}
        <a href="mailto:medhalabs04@gmail.com" className="text-indigo-600 hover:underline">medhalabs04@gmail.com</a>.
        We may suspend or terminate your access if you violate these Terms, misuse the Service, or if
        required to comply with a third-party platform&apos;s policies (e.g., Google or Meta revoking API
        access due to a policy violation). Upon termination, your right to use the Service ends, and data
        will be handled per our Privacy Policy&apos;s retention and deletion terms.
      </P>

      <H2>9. Disclaimers</H2>
      <P>
        The Service is provided &quot;as is&quot; and &quot;as available,&quot; without warranties of any
        kind, express or implied, including warranties of merchantability, fitness for a particular
        purpose, or non-infringement. We do not guarantee that the Service will be uninterrupted,
        error-free, or that message delivery through third-party providers (Google, Microsoft, Meta) will
        always succeed.
      </P>

      <H2>10. Limitation of liability</H2>
      <P>
        To the maximum extent permitted by law, Medha Labs shall not be liable for any indirect,
        incidental, special, consequential, or punitive damages, or any loss of data, revenue, or
        business, arising from your use of the Service, even if advised of the possibility of such
        damages. Our total liability for any claim arising from these Terms or the Service shall not
        exceed the amount you paid us, if any, in the 12 months preceding the claim.
      </P>

      <H2>11. Indemnification</H2>
      <P>
        You agree to indemnify and hold Medha Labs harmless from any claims, damages, or expenses
        (including reasonable legal fees) arising from your use of the Service, your violation of these
        Terms, or your violation of any third party&apos;s rights, including recipients of messages you
        send through the Service.
      </P>

      <H2>12. Governing law</H2>
      <P>
        These Terms are governed by the laws of India, without regard to conflict-of-law principles. Any
        disputes arising from these Terms or the Service shall be subject to the exclusive jurisdiction of
        the courts of India.
      </P>

      <H2>13. Changes to these Terms</H2>
      <P>
        We may update these Terms from time to time. Material changes will be notified via the Service or
        by email. Continued use of the Service after changes take effect constitutes acceptance of the
        revised Terms.
      </P>

      <H2>14. Contact us</H2>
      <P>
        Medha Labs<br />
        Email: <a href="mailto:medhalabs04@gmail.com" className="text-indigo-600 hover:underline">medhalabs04@gmail.com</a><br />
        Website: <a href="https://medhalabs.in" className="text-indigo-600 hover:underline">https://medhalabs.in</a>
      </P>
    </article>
  );
}
