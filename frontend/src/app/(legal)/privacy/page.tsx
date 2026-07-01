import type { Metadata } from "next";
import { Updated, H2, H3, P, UL, Code, ScopeTable } from "../legal-ui";

export const metadata: Metadata = {
  title: "Privacy Policy — Medha Sync",
};

export default function PrivacyPolicyPage() {
  return (
    <article>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Privacy Policy</h1>
      <Updated date="July 1, 2026" />

      <P>
        This Privacy Policy describes how Medha Labs (&quot;Medha Labs,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
        collects, uses, stores, and discloses information in connection with the Medha Sync application
        (the &quot;Service&quot;). This policy applies to all users of the Service.
      </P>
      <P>
        If you have questions about this policy, contact us at{" "}
        <a href="mailto:medhalabs04@gmail.com" className="text-indigo-600 hover:underline">medhalabs04@gmail.com</a>.
      </P>

      <H2>1. Who we are</H2>
      <P>
        Medha Labs is a software development studio based in India, operating the website{" "}
        <a href="https://medhalabs.in" className="text-indigo-600 hover:underline">https://medhalabs.in</a>{" "}
        and the Medha Sync application, a unified inbox and customer communication platform that helps
        businesses manage email, WhatsApp messaging, contacts, and marketing broadcasts in one place.
      </P>

      <H2>2. Information we collect</H2>

      <H3>2.1 Account information</H3>
      <P>
        When you sign up, we collect your name, email address, and a securely hashed password. If you
        sign in with Google, we receive your Google account ID, name, email address, and profile picture.
      </P>

      <H3>2.2 Google user data</H3>
      <P>
        Medha Sync integrates with Gmail so you can send and receive email through the Service. When you
        connect a Gmail account, we request the following Google OAuth scopes:
      </P>
      <ScopeTable
        rows={[
          { scope: <Code>https://mail.google.com/</Code>, purpose: "Read, sync, send, and organize email on your behalf inside the Service's unified inbox" },
          { scope: <>
              <Code>openid</Code>, <Code>email</Code>, <Code>profile</Code>
            </>, purpose: "Confirm your identity and display your name/email/avatar in the app" },
        ]}
      />
      <P>We use this access only to:</P>
      <UL>
        <li>Fetch and display incoming and outgoing email messages, threads, and attachments inside Medha Sync</li>
        <li>Send email on your behalf when you compose or reply from within the Service</li>
        <li>Automatically create or match a contact record from the sender/recipient of an email</li>
      </UL>
      <P>
        We do <strong>not</strong> use Google user data for advertising, sell it, or share it with third
        parties except as described in Section 4. Medha Sync&apos;s use and transfer of information
        received from Google APIs adheres to the{" "}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
          Google API Services User Data Policy
        </a>, including the Limited Use requirements.
      </P>

      <H3>2.3 Other connected accounts</H3>
      <P>
        If you connect a Microsoft Outlook account, an IMAP/SMTP email account, or a WhatsApp Business
        (Meta Cloud API) number, we collect and process equivalent data from those providers — account
        credentials (encrypted at rest), message content, attachments, and delivery metadata — solely to
        provide the same unified inbox functionality.
      </P>

      <H3>2.4 Contact and CRM data</H3>
      <P>
        When you or your connected accounts communicate with other people, we store the counterparties&apos;
        name, phone number, email address, message history, tags, notes, pipeline/deal stage, and any
        custom fields you add, so you can manage those relationships inside the Service.
      </P>

      <H3>2.5 Messages, broadcasts, and attachments</H3>
      <P>
        We store the content of emails and WhatsApp messages sent and received through the Service, along
        with file attachments (stored in our object storage), and aggregate delivery/read statistics for
        broadcast campaigns you create.
      </P>

      <H3>2.6 Usage data</H3>
      <P>
        We automatically collect log data such as IP address, browser type, device information, pages
        visited, and timestamps, to operate, secure, and improve the Service.
      </P>

      <H3>2.7 Cookies</H3>
      <P>
        We use essential cookies/local storage to keep you signed in and remember preferences. We do not
        use third-party advertising cookies.
      </P>

      <H2>3. How we use information</H2>
      <P>We use the information above to:</P>
      <UL>
        <li>Provide, operate, and maintain the unified inbox, contacts, broadcasts, automations, and analytics features</li>
        <li>Authenticate you and keep your account secure</li>
        <li>Sync and deliver email and WhatsApp messages on your behalf</li>
        <li>Respond to support requests</li>
        <li>Monitor and improve the reliability and performance of the Service</li>
        <li>Comply with legal obligations</li>
      </UL>
      <P>We do not sell your personal information or Google user data, and we do not use it to serve ads.</P>

      <H2>4. How we share information</H2>
      <P>We share information only with:</P>
      <UL>
        <li><strong>Google, Microsoft, and Meta</strong> — to the extent necessary to send/receive email or WhatsApp messages through their APIs on your instruction</li>
        <li><strong>Infrastructure and sub-processors</strong> we use to run the Service (database, object storage, and hosting providers), under confidentiality obligations, solely to provide the Service</li>
        <li><strong>Law enforcement or regulators</strong>, if required by law, subpoena, or to protect the rights, property, or safety of Medha Labs, our users, or the public</li>
        <li><strong>A successor entity</strong>, if Medha Labs is involved in a merger, acquisition, or sale of assets, subject to this policy or a materially equivalent one</li>
      </UL>
      <P>
        We never sell personal data or Google user data to third parties, and we never share it for
        third-party advertising or unrelated purposes.
      </P>

      <H2>5. Data storage and security</H2>
      <P>
        Data is stored in our PostgreSQL database and object storage, protected by access controls and
        encryption. OAuth tokens (including Google refresh/access tokens) and email account passwords are
        encrypted at rest. No method of transmission or storage is 100% secure, and we cannot guarantee
        absolute security.
      </P>

      <H2>6. Data retention and deletion</H2>
      <P>
        We retain your account data, connected-account tokens, and message/contact data for as long as
        your account remains active, so the Service can continue to function. If you delete your account
        or request deletion by emailing{" "}
        <a href="mailto:medhalabs04@gmail.com" className="text-indigo-600 hover:underline">medhalabs04@gmail.com</a>,
        we will delete or anonymize your personal data, connected-account tokens, and associated messages
        within 30 days, except where we are required to retain limited records for legal or security purposes.
      </P>
      <P>
        Disconnecting a Google account in-app, or revoking Medha Sync&apos;s access from your{" "}
        <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
          Google Account permissions page
        </a>, immediately stops further access and triggers deletion of the stored tokens for that account.
      </P>

      <H2>7. Your rights</H2>
      <P>
        Depending on your location, you may have the right to access, correct, export, or delete your
        personal data, and to withdraw consent for us to process it. To exercise these rights, contact{" "}
        <a href="mailto:medhalabs04@gmail.com" className="text-indigo-600 hover:underline">medhalabs04@gmail.com</a>.
        You can also revoke Medha Sync&apos;s access to your Google account at any time via{" "}
        <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
          Google Account permissions
        </a>.
      </P>

      <H2>8. Children&apos;s privacy</H2>
      <P>
        The Service is intended for business use by adults and is not directed to individuals under 18.
        We do not knowingly collect personal information from children.
      </P>

      <H2>9. International data transfers</H2>
      <P>
        Medha Labs is based in India, and the Service&apos;s infrastructure may be hosted in India or other
        countries. By using the Service, you consent to your information being processed in these
        locations, under the protections described in this policy.
      </P>

      <H2>10. Changes to this policy</H2>
      <P>
        We may update this Privacy Policy from time to time. Material changes will be notified via the
        Service or by email. The &quot;Last updated&quot; date above reflects the latest revision.
      </P>

      <H2>11. Contact us</H2>
      <P>
        Medha Labs<br />
        Email: <a href="mailto:medhalabs04@gmail.com" className="text-indigo-600 hover:underline">medhalabs04@gmail.com</a><br />
        Website: <a href="https://medhalabs.in" className="text-indigo-600 hover:underline">https://medhalabs.in</a>
      </P>
    </article>
  );
}
