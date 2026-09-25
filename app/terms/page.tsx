import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";
import { SITE } from "@/lib/plan-metadata";

export const metadata: Metadata = {
  title: "Terms of Service · Leave By",
  description: "The rules for using Leave By, in plain language.",
  metadataBase: new URL(SITE),
  alternates: { canonical: "/terms" },
};

const mail = <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;

const sections: LegalSection[] = [
  {
    id: "agreement",
    title: "Agreeing to these terms",
    body: (
      <>
        <p>
          These Terms of Service (“Terms”) are an agreement between you and {LEGAL.product} (“Leave By”, “we”, “us”) about your use of {LEGAL.site}, the Leave By web app, and anything else we offer
          under the Leave By name (together, the “Service”).
        </p>
        <p>By using the Service you agree to these Terms and to our <a href="/privacy">Privacy Policy</a>. If you don’t agree, please don’t use the Service.</p>
        <p>You must be at least 13 years old to use the Service. If you are under the age of majority where you live, a parent or guardian must agree to these Terms for you.</p>
      </>
    ),
  },
  {
    id: "what-it-is",
    title: "What Leave By is, and isn’t",
    body: (
      <>
        <p>
          Leave By estimates when you should leave for the airport. It combines the details you give it (your flight, where you’re leaving from, how you’re getting there, whether you’re checking a bag,
          your security programs and how much spare time you want) with information from other sources, such as traffic, weather, flight status, airport advisories and typical security wait times.
        </p>
        <p>
          <strong>Every time and duration Leave By shows is an estimate, not a promise.</strong> Traffic, security lines, gate changes, weather, airline schedules and closures can change quickly and
          without warning, and our sources can be late, incomplete or wrong. Leave By is not affiliated with, endorsed by or acting for any airline, airport, the TSA, the FAA, or any rideshare company.
        </p>
      </>
    ),
  },
  {
    id: "your-responsibility",
    title: "Making your flight is your responsibility",
    body: (
      <>
        <p>You are responsible for getting to your flight on time. That includes:</p>
        <ul>
          <li>checking your flight’s status, gate and departure time with your airline;</li>
          <li>meeting your airline’s check-in, bag drop, boarding and document deadlines;</li>
          <li>allowing extra time when you’re unsure, traveling with others, or conditions change; and</li>
          <li>obeying traffic laws and staying safe. Don’t use the Service while driving.</li>
        </ul>
        <p>
          We are not responsible for missed flights, missed connections, denied boarding, rebooking or change fees, lost reservations, rideshare or parking charges, or any other cost or inconvenience
          that results from relying on the Service.
        </p>
      </>
    ),
  },
  {
    id: "third-parties",
    title: "Other companies’ services",
    body: (
      <>
        <p>
          The Service uses and links to services we don’t own or control, including mapping and routing providers, weather services, the FAA, flight-status sources, an AI research provider, and
          Uber, Lyft, Apple Maps and Google Maps. Links such as “Uber” or “Lyft” open those services, and your use of them is governed by their own terms and privacy policies, not ours.
        </p>
        <p>We don’t guarantee the accuracy or availability of any third-party information or service, and we aren’t responsible for their content, prices, actions or failures.</p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Using the Service fairly",
    body: (
      <>
        <p>You may use the Service for your own personal, non-commercial trip planning. You agree not to:</p>
        <ul>
          <li>break the law or anyone else’s rights while using the Service;</li>
          <li>scrape, crawl, resell or bulk-query the Service, or use it to build a competing product;</li>
          <li>interfere with, overload or try to break the Service or its security; or</li>
          <li>misrepresent Leave By’s results as official airline, airport or government information.</li>
        </ul>
        <p>We may limit, suspend or block access to anyone who misuses the Service.</p>
      </>
    ),
  },
  {
    id: "ownership",
    title: "Ownership and feedback",
    body: (
      <>
        <p>
          The Service, including its design, text, graphics and software, belongs to us or our licensors and is protected by intellectual property laws. These Terms don’t give you any rights to our
          names, logos or other brand features.
        </p>
        <p>If you send us ideas or feedback, you let us use them without any obligation to you.</p>
      </>
    ),
  },
  {
    id: "warranty",
    title: "No warranties",
    body: (
      <p className="uppercase-legal">
        The Service is provided “as is” and “as available.” To the fullest extent the law allows, we disclaim all warranties, express or implied, including warranties of merchantability, fitness for a
        particular purpose, accuracy, timeliness and non-infringement. We don’t warrant that the Service will be uninterrupted, error-free or secure, or that any estimate will be correct.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limits on our liability",
    body: (
      <>
        <p className="uppercase-legal">
          To the fullest extent the law allows, Leave By and its owners, team members and suppliers will not be liable for any indirect, incidental, special, consequential, exemplary or punitive damages,
          or for any lost flights, travel costs, profits, data or goodwill, arising out of or related to the Service, even if we were told they were possible.
        </p>
        <p className="uppercase-legal">
          Our total liability for any claim related to the Service is limited to the greater of the amount you paid us for the Service in the 12 months before the claim (which, for the free Service, is
          zero) or US $50.
        </p>
        <p>Some places don’t allow some of these limits, so they may not all apply to you. Nothing in these Terms limits liability that can’t be limited by law.</p>
      </>
    ),
  },
  {
    id: "indemnity",
    title: "Your promise to cover misuse",
    body: (
      <p>
        If you misuse the Service or break these Terms and someone makes a claim against us because of it, you agree to cover our reasonable losses and costs, including reasonable legal fees, to the
        extent the law allows.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to the Service and these Terms",
    body: (
      <>
        <p>We may change, pause or stop any part of the Service at any time. The Service is free today; if we ever charge for something, we’ll tell you before you pay.</p>
        <p>
          We may update these Terms. When we do, we’ll change the date at the top of this page, and for significant changes we’ll give reasonable notice on the site. If you keep using the Service after
          changes take effect, you accept the updated Terms.
        </p>
      </>
    ),
  },
  {
    id: "disputes",
    title: "Resolving disputes",
    body: (
      <>
        <p>
          If you have a problem with the Service, please email us first at {mail}. Most issues can be sorted out quickly, and we’ll try in good faith for 30 days before either of us goes to court.
        </p>
        <p>
          These Terms are governed by the laws of {LEGAL.governingLaw}, without regard to its conflict-of-laws rules. Any dispute will be handled in the state or federal courts located there, except
          that either of us may bring an individual claim in small-claims court. To the extent the law allows, claims must be brought individually and not as part of a class or representative action.
        </p>
        <p>If you live in a country whose laws give you the right to bring claims in your local courts or under your local law, these Terms don’t take that right away.</p>
      </>
    ),
  },
  {
    id: "general",
    title: "The fine print",
    body: (
      <>
        <p>
          These Terms and the Privacy Policy are the whole agreement between you and us about the Service. If a court finds any part unenforceable, the rest stays in effect. If we don’t enforce a term
          right away, we haven’t given up the right to enforce it later. You may not transfer these Terms; we may transfer them as part of a merger, sale or reorganization.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: <p>Questions about these Terms? Email {mail}.</p>,
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      summary={
        <>
          <p>Leave By is a free tool that estimates when to leave for the airport. It’s a helpful guide, not a guarantee.</p>
          <p>
            Traffic, security lines and flights can change without warning, so you’re responsible for making your flight: check with your airline, follow its deadlines, and leave extra time if you’re
            unsure.
          </p>
          <p>We’re not liable for missed flights or related costs, and links to Uber, Lyft and maps apps are governed by those companies’ own terms.</p>
        </>
      }
      sections={sections}
    />
  );
}
