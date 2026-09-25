import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";
import { SITE } from "@/lib/plan-metadata";

export const metadata: Metadata = {
  title: "Privacy Policy · Leave By",
  description: "What Leave By collects, why, and who it shares it with. No accounts, no ads, no selling your data.",
  metadataBase: new URL(SITE),
  alternates: { canonical: "/privacy" },
};

const mail = <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;

const PROVIDERS: Array<[string, string, string]> = [
  ["Vercel", "Hosts the site, runs our servers and provides our cookie-free usage analytics. Receives your requests, including your IP address.", "https://vercel.com/docs/analytics/privacy-policy"],
  ["OpenAI", "Researches your trip: your flight, airports, travel times and your starting area (as the place name you chose), using web search. We don’t send your name or contact details.", "https://openai.com/policies/privacy-policy"],
  ["Komoot Photon (OpenStreetMap data) and Zippopotam.us", "Turn the place you type, or your device location, into a map point, and suggest places as you type.", "https://www.komoot.com/privacy"],
  ["OSRM (Project OSRM)", "Calculates the driving route and distance from your starting point to the airport.", "https://project-osrm.org"],
  ["National Weather Service and Open-Meteo", "Provide the weather forecast for your departure airport. We send the airport’s location, not yours.", "https://open-meteo.com/en/terms"],
  ["Federal Aviation Administration", "Provides live airport status such as ground stops and delay programs. No personal information is sent.", "https://www.faa.gov/privacy"],
  ["Flight-status sources (such as FlightAware and flight-status.com)", "Look up your flight’s schedule, terminal and gate from the flight number and date.", "https://www.flightaware.com/about/privacy"],
  ["avs.io", "Serves airline logos. Your browser loads these directly, so this service sees your IP address.", "https://pics.avs.io"],
];

const sections: LegalSection[] = [
  {
    id: "overview",
    title: "Who we are and what this covers",
    body: (
      <p>
        This policy explains how {LEGAL.product} (“Leave By”, “we”, “us”) handles information when you use {LEGAL.site} and the Leave By web app (the “Service”). If you have questions, email {mail}.
      </p>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <>
        <p>
          <strong>Trip details you enter.</strong> Your flight number and date, where you’re leaving from, how you’re getting there, whether you’re checking a bag, your security programs (like
          TSA PreCheck or CLEAR) and how much spare time you want.
        </p>
        <p>
          <strong>Your location, only if you ask.</strong> If you tap to use your current location, your browser asks your permission and then shares your approximate coordinates with us so we can
          find your starting point. You can say no and type a place instead.
        </p>
        <p>
          <strong>Technical information.</strong> Like every website, our hosting provider receives basic request data such as your IP address, browser type and the pages and requests you make. We
          use this to run, secure and debug the Service.
        </p>
        <p>
          <strong>Anonymous usage analytics.</strong> We use Vercel Web Analytics to understand how Leave By is used: pages viewed, the site that referred you, your country, device and browser type,
          and simple in-app events such as “plan created” (with the departure airport and how you’re getting there), “flight not found”, or which ride or map button was tapped. It doesn’t use cookies,
          doesn’t follow you across other sites, and isn’t tied to your identity. It never receives your address, location or share links.
        </p>
        <p>
          <strong>What we don’t collect.</strong> There are no accounts, so we don’t collect your name, email, phone number or payment details. We don’t use advertising trackers or tracking cookies.
        </p>
      </>
    ),
  },
  {
    id: "device",
    title: "Information saved on your device",
    body: (
      <p>
        If you save a home place, recent places or your preferences (“Saved on this phone”), they’re stored in your browser’s local storage on your own device, not on our servers. You can erase them at
        any time with “Forget everything” in the app’s “Saved on this phone” sheet, or by clearing your browser’s site data.
      </p>
    ),
  },
  {
    id: "use",
    title: "How we use information",
    body: (
      <>
        <p>We use your information only to:</p>
        <ul>
          <li>calculate your leave-by time and trip plan;</li>
          <li>create share links, calendar reminders and ride links when you ask for them;</li>
          <li>understand, in aggregate, how people use Leave By so we can improve it;</li>
          <li>keep the Service working, secure and free of abuse; and</li>
          <li>comply with the law.</li>
        </ul>
        <p>We don’t sell your personal information, “share” it for cross-context behavioral advertising, or use it to build advertising profiles.</p>
      </>
    ),
  },
  {
    id: "providers",
    title: "Services that help run Leave By",
    body: (
      <>
        <p>To build your plan, we send the minimum trip details needed to these providers. Each handles data under its own privacy policy:</p>
        <ul>
          {PROVIDERS.map(([name, what, url]) => (
            <li key={name}>
              <strong>{name}.</strong> {what}{" "}
              <a href={url} target="_blank" rel="noreferrer">
                Their policy
              </a>
            </li>
          ))}
        </ul>
        <p>
          When you tap Uber, Lyft, Apple Maps or Google Maps, you leave Leave By and that company’s privacy policy applies. We pass along only what’s needed to open your trip, such as the pickup and
          drop-off points.
        </p>
        <p>We may also disclose information if the law requires it, to protect people’s safety or our rights, or as part of a merger or sale of the Service (with this policy continuing to apply).</p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Share links and reminders",
    body: (
      <p>
        When you share a plan, the plan itself, including your flight and the name of your starting place, is packed into the link. We don’t store it. Anyone who has the link can see that plan, so
        share it only with people you trust. Calendar reminders are created on the fly and not stored by us.
      </p>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <p>
        We don’t keep a database of your trips. Trip details are processed to build your plan and then discarded; we may briefly cache general results (such as typical traffic for an area and hour) to
        keep the Service fast. Server logs kept by our hosting provider are retained for a limited period under its policies. Information on your device stays until you erase it.
      </p>
    ),
  },
  {
    id: "choices",
    title: "Your choices and rights",
    body: (
      <>
        <p>
          You can use Leave By without sharing your location, and you can erase saved information on your device at any time. Depending on where you live (for example California, other US states, the
          EU or the UK), you may have the right to know what personal information we hold about you, to get a copy of it, to correct or delete it, and to object to or limit how we use it.
        </p>
        <p>
          Because we don’t keep accounts or trip histories, we usually won’t have information tied to you. To make a request, email {mail}. We won’t discriminate against you for exercising your
          rights. If you’re in the EU or UK, we process your information to provide the Service you ask for and for our legitimate interest in keeping it running securely, and you can complain to your
          local data protection authority.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: <p>Leave By isn’t directed to children under 13, and we don’t knowingly collect personal information from them. If you think a child has given us information, email {mail} and we’ll delete it.</p>,
  },
  {
    id: "security",
    title: "Security and where data is processed",
    body: (
      <p>
        We use encryption in transit (HTTPS) and limit what we collect in the first place. No method of transmission or storage is completely secure, so we can’t guarantee absolute security. Leave By
        is run from the United States, and our providers may process information in the US and other countries.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: <p>If we change this policy, we’ll update the date at the top. If a change is significant, we’ll give reasonable notice on the site before it takes effect.</p>,
  },
  {
    id: "contact",
    title: "Contact",
    body: <p>Questions or requests about your privacy? Email {mail}.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary={
        <>
          <p>No accounts, no ads, no tracking cookies, and we never sell your data. We count visits and app usage anonymously to improve the product.</p>
          <p>
            We use your flight and starting point only to work out when you should leave. Your saved places and preferences stay on your own phone. Location is used only if you tap “use my location”.
          </p>
          <p>To build your plan we rely on a few services (hosting, maps, weather, flight status and an AI research provider), listed below with links to their policies.</p>
        </>
      }
      sections={sections}
    />
  );
}
