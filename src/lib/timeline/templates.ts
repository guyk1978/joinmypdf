import type { Milestone, Task, TimelineProject } from "./types";
import { TASK_COLOR_PRESETS, MILESTONE_COLOR_PRESETS } from "./constants";
import { createMilestoneId, createTaskId } from "./defaults";

/** Stable anchor so static builds render consistent chart ranges. */
const ANCHOR = "2026-06-01";

function dateAdd(days: number): string {
  const d = new Date(`${ANCHOR}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type TaskSeed = Omit<Task, "id">;
type MilestoneSeed = Omit<Milestone, "id">;

export type TimelineTemplateProfile = {
  slug: string;
  profession: string;
  professionLabel: string;
  locale: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  lede: string;
  keywords: string[];
  defaultProject: {
    title: string;
    tasks: TaskSeed[];
    milestones: MilestoneSeed[];
  };
};

export const TIMELINE_TEMPLATE_PROFILES: TimelineTemplateProfile[] = [
  {
    slug: "wedding-planner",
    profession: "wedding planner",
    professionLabel: "Wedding Planner",
    locale: "en-US",
    metaTitle: "Free Wedding Planner Timeline Template | JoinMyPDF",
    metaDescription:
      "Plan venue booking, vendors, and rehearsal week on a free Gantt chart. Edit in your browser and download a landscape PDF instantly—100% client-side, no upload.",
    h1: "Free wedding planner timeline & Gantt template",
    lede:
      "Map the full planning runway from engagement party to wedding day. Pre-filled phases for venue, catering, florals, and guest logistics—customize dates and export a shareable PDF locally.",
    keywords: [
      "wedding planner timeline",
      "wedding Gantt chart",
      "wedding planning schedule template",
    ],
    defaultProject: {
      title: "Martinez–Chen wedding (October)",
      tasks: [
        {
          title: "Venue scouting & contract",
          startDate: dateAdd(0),
          endDate: dateAdd(21),
          color: TASK_COLOR_PRESETS[0],
          rowOrder: 0,
        },
        {
          title: "Catering tastings & menu lock",
          startDate: dateAdd(14),
          endDate: dateAdd(42),
          color: TASK_COLOR_PRESETS[1],
          rowOrder: 1,
        },
        {
          title: "Florals, decor & rentals",
          startDate: dateAdd(28),
          endDate: dateAdd(63),
          color: TASK_COLOR_PRESETS[2],
          rowOrder: 2,
        },
        {
          title: "Invitations & RSVP tracking",
          startDate: dateAdd(35),
          endDate: dateAdd(77),
          color: TASK_COLOR_PRESETS[3],
          rowOrder: 3,
        },
        {
          title: "Rehearsal dinner & day-of coordination",
          startDate: dateAdd(84),
          endDate: dateAdd(98),
          color: TASK_COLOR_PRESETS[4],
          rowOrder: 4,
        },
      ],
      milestones: [
        { title: "Engagement party", date: dateAdd(7), color: MILESTONE_COLOR_PRESETS[0] },
        { title: "Wedding day", date: dateAdd(98), color: MILESTONE_COLOR_PRESETS[1] },
      ],
    },
  },
  {
    slug: "construction-project",
    profession: "construction project manager",
    professionLabel: "Construction Project",
    locale: "en-US",
    metaTitle: "Free Construction Project Timeline Template | JoinMyPDF",
    metaDescription:
      "Schedule permits, foundations, framing, and inspections on a browser-based Gantt chart. Download a landscape PDF client-side—no cloud upload required.",
    h1: "Free construction project timeline template",
    lede:
      "Track residential or light commercial builds from permit pull to certificate of occupancy. Realistic phases for sitework, structure, MEP, and punch list—edit dates and share PDFs with subs and owners.",
    keywords: [
      "construction timeline template",
      "construction Gantt chart",
      "building project schedule",
    ],
    defaultProject: {
      title: "Oak Street duplex renovation",
      tasks: [
        {
          title: "Permits & site mobilization",
          startDate: dateAdd(0),
          endDate: dateAdd(18),
          color: TASK_COLOR_PRESETS[0],
          rowOrder: 0,
        },
        {
          title: "Foundation & structural framing",
          startDate: dateAdd(15),
          endDate: dateAdd(48),
          color: TASK_COLOR_PRESETS[1],
          rowOrder: 1,
        },
        {
          title: "Rough MEP & envelope close-in",
          startDate: dateAdd(42),
          endDate: dateAdd(70),
          color: TASK_COLOR_PRESETS[2],
          rowOrder: 2,
        },
        {
          title: "Interior finishes & fixtures",
          startDate: dateAdd(65),
          endDate: dateAdd(95),
          color: TASK_COLOR_PRESETS[3],
          rowOrder: 3,
        },
        {
          title: "Final inspection & punch list",
          startDate: dateAdd(90),
          endDate: dateAdd(105),
          color: TASK_COLOR_PRESETS[4],
          rowOrder: 4,
        },
      ],
      milestones: [
        { title: "Permit approved", date: dateAdd(12), color: MILESTONE_COLOR_PRESETS[0] },
        { title: "Certificate of occupancy", date: dateAdd(105), color: MILESTONE_COLOR_PRESETS[1] },
      ],
    },
  },
  {
    slug: "software-product-launch",
    profession: "product manager",
    professionLabel: "Software Product Launch",
    locale: "en-US",
    metaTitle: "Free Software Product Launch Timeline Template | JoinMyPDF",
    metaDescription:
      "Plan beta, QA, and go-live on a free product launch Gantt chart. Client-side editor with instant landscape PDF export—nothing uploaded to our servers.",
    h1: "Free software product launch timeline template",
    lede:
      "Coordinate engineering, design, and GTM for a SaaS or app release. Pre-loaded sprints for discovery, build, dogfood, and launch comms—tweak milestones and download a PDF for stakeholders.",
    keywords: [
      "product launch timeline",
      "software release Gantt chart",
      "go-live schedule template",
    ],
    defaultProject: {
      title: "Atlas CRM v3.0 launch",
      tasks: [
        {
          title: "Scope lock & technical design",
          startDate: dateAdd(0),
          endDate: dateAdd(14),
          color: TASK_COLOR_PRESETS[0],
          rowOrder: 0,
        },
        {
          title: "Core feature development",
          startDate: dateAdd(10),
          endDate: dateAdd(56),
          color: TASK_COLOR_PRESETS[1],
          rowOrder: 1,
        },
        {
          title: "Private beta & bug bash",
          startDate: dateAdd(50),
          endDate: dateAdd(70),
          color: TASK_COLOR_PRESETS[2],
          rowOrder: 2,
        },
        {
          title: "Docs, pricing & launch assets",
          startDate: dateAdd(60),
          endDate: dateAdd(77),
          color: TASK_COLOR_PRESETS[3],
          rowOrder: 3,
        },
        {
          title: "Production rollout & monitoring",
          startDate: dateAdd(75),
          endDate: dateAdd(84),
          color: TASK_COLOR_PRESETS[4],
          rowOrder: 4,
        },
      ],
      milestones: [
        { title: "Beta kickoff", date: dateAdd(50), color: MILESTONE_COLOR_PRESETS[0] },
        { title: "Launch day", date: dateAdd(84), color: MILESTONE_COLOR_PRESETS[1] },
      ],
    },
  },
  {
    slug: "bar-exam-study",
    profession: "law student",
    professionLabel: "Bar Exam Study",
    locale: "en-US",
    metaTitle: "Free Bar Exam Study Timeline Template | JoinMyPDF",
    metaDescription:
      "Map bar prep phases, practice exams, and review weeks on a free study Gantt chart. Edit locally and download PDF—client-side only, no signup.",
    h1: "Free bar exam study timeline template",
    lede:
      "Structure MBE drills, essay practice, and final review leading to exam day. Realistic study blocks you can shift around your commercial course schedule—export a printable plan in seconds.",
    keywords: [
      "bar exam study schedule",
      "bar prep timeline",
      "law school Gantt chart",
    ],
    defaultProject: {
      title: "July bar exam study plan",
      tasks: [
        {
          title: "Foundation lectures (MBE subjects)",
          startDate: dateAdd(0),
          endDate: dateAdd(35),
          color: TASK_COLOR_PRESETS[0],
          rowOrder: 0,
        },
        {
          title: "Essay workshop & rule memorization",
          startDate: dateAdd(28),
          endDate: dateAdd(63),
          color: TASK_COLOR_PRESETS[1],
          rowOrder: 1,
        },
        {
          title: "Timed practice sets (MBE + MEE)",
          startDate: dateAdd(56),
          endDate: dateAdd(84),
          color: TASK_COLOR_PRESETS[2],
          rowOrder: 2,
        },
        {
          title: "Full simulated exam days",
          startDate: dateAdd(78),
          endDate: dateAdd(91),
          color: TASK_COLOR_PRESETS[3],
          rowOrder: 3,
        },
        {
          title: "Light review & rest buffer",
          startDate: dateAdd(88),
          endDate: dateAdd(98),
          color: TASK_COLOR_PRESETS[4],
          rowOrder: 4,
        },
      ],
      milestones: [
        { title: "First practice exam", date: dateAdd(56), color: MILESTONE_COLOR_PRESETS[0] },
        { title: "Bar exam", date: dateAdd(99), color: MILESTONE_COLOR_PRESETS[1] },
      ],
    },
  },
  {
    slug: "video-production",
    profession: "video producer",
    professionLabel: "Video Production",
    locale: "en-US",
    metaTitle: "Free Video Production Timeline Template | JoinMyPDF",
    metaDescription:
      "Schedule pre-production, shoot days, edit, and color on a free production Gantt chart. Browser-based PDF export with no file uploads.",
    h1: "Free video production timeline template",
    lede:
      "Keep agency and client teams aligned from creative brief to final master delivery. Pre-filled phases for scripting, location prep, principal photography, post, and approvals.",
    keywords: [
      "video production schedule",
      "film production Gantt chart",
      "post-production timeline template",
    ],
    defaultProject: {
      title: "Brand anthem spot — 60s hero",
      tasks: [
        {
          title: "Creative brief & storyboard",
          startDate: dateAdd(0),
          endDate: dateAdd(12),
          color: TASK_COLOR_PRESETS[0],
          rowOrder: 0,
        },
        {
          title: "Casting, locations & gear prep",
          startDate: dateAdd(8),
          endDate: dateAdd(25),
          color: TASK_COLOR_PRESETS[1],
          rowOrder: 1,
        },
        {
          title: "Principal photography (3 shoot days)",
          startDate: dateAdd(24),
          endDate: dateAdd(28),
          color: TASK_COLOR_PRESETS[2],
          rowOrder: 2,
        },
        {
          title: "Offline edit & client review cuts",
          startDate: dateAdd(27),
          endDate: dateAdd(49),
          color: TASK_COLOR_PRESETS[3],
          rowOrder: 3,
        },
        {
          title: "Color, sound mix & master delivery",
          startDate: dateAdd(45),
          endDate: dateAdd(56),
          color: TASK_COLOR_PRESETS[4],
          rowOrder: 4,
        },
      ],
      milestones: [
        { title: "Shoot day 1", date: dateAdd(24), color: MILESTONE_COLOR_PRESETS[0] },
        { title: "Final master delivery", date: dateAdd(56), color: MILESTONE_COLOR_PRESETS[1] },
      ],
    },
  },
  {
    slug: "event-planning",
    profession: "event planner",
    professionLabel: "Event Planning",
    locale: "en-US",
    metaTitle: "Free Event Planning Timeline Template | JoinMyPDF",
    metaDescription:
      "Plan corporate galas, conferences, or fundraisers on a free event Gantt chart. Instant client-side landscape PDF—private, no cloud processing.",
    h1: "Free event planning timeline template",
    lede:
      "Coordinate vendors, run-of-show, and marketing for a 200–2,000 guest event. Sample tasks for venue hold, sponsorship, AV, and on-site staffing—adjust dates and export for your client deck.",
    keywords: [
      "event planning timeline",
      "conference Gantt chart",
      "event schedule template",
    ],
    defaultProject: {
      title: "Annual partner summit 2026",
      tasks: [
        {
          title: "Venue contract & date hold",
          startDate: dateAdd(0),
          endDate: dateAdd(20),
          color: TASK_COLOR_PRESETS[0],
          rowOrder: 0,
        },
        {
          title: "Speaker outreach & agenda design",
          startDate: dateAdd(14),
          endDate: dateAdd(45),
          color: TASK_COLOR_PRESETS[1],
          rowOrder: 1,
        },
        {
          title: "Sponsorship packages & registration launch",
          startDate: dateAdd(30),
          endDate: dateAdd(60),
          color: TASK_COLOR_PRESETS[2],
          rowOrder: 2,
        },
        {
          title: "AV, catering & experiential vendors",
          startDate: dateAdd(50),
          endDate: dateAdd(75),
          color: TASK_COLOR_PRESETS[3],
          rowOrder: 3,
        },
        {
          title: "Run-of-show rehearsals & onsite ops",
          startDate: dateAdd(72),
          endDate: dateAdd(84),
          color: TASK_COLOR_PRESETS[4],
          rowOrder: 4,
        },
      ],
      milestones: [
        { title: "Registration opens", date: dateAdd(45), color: MILESTONE_COLOR_PRESETS[0] },
        { title: "Event day", date: dateAdd(84), color: MILESTONE_COLOR_PRESETS[1] },
      ],
    },
  },
  {
    slug: "house-renovation",
    profession: "homeowner",
    professionLabel: "House Renovation",
    locale: "en-US",
    metaTitle: "Free House Renovation Timeline Template | JoinMyPDF",
    metaDescription:
      "Track demolition, trades, and finishes for a home remodel on a free Gantt chart. Edit in-browser and download PDF without uploading floor plans.",
    h1: "Free house renovation timeline template",
    lede:
      "Plan a kitchen–bath–flooring remodel with realistic lead times for demo, rough-in, cabinets, and punch list. Perfect for homeowners coordinating contractors and material deliveries.",
    keywords: [
      "home renovation schedule",
      "remodel timeline template",
      "house renovation Gantt chart",
    ],
    defaultProject: {
      title: "Main floor kitchen & bath remodel",
      tasks: [
        {
          title: "Design selections & material orders",
          startDate: dateAdd(0),
          endDate: dateAdd(21),
          color: TASK_COLOR_PRESETS[0],
          rowOrder: 0,
        },
        {
          title: "Demo & structural adjustments",
          startDate: dateAdd(18),
          endDate: dateAdd(28),
          color: TASK_COLOR_PRESETS[1],
          rowOrder: 1,
        },
        {
          title: "Plumbing & electrical rough-in",
          startDate: dateAdd(26),
          endDate: dateAdd(42),
          color: TASK_COLOR_PRESETS[2],
          rowOrder: 2,
        },
        {
          title: "Drywall, cabinets & tile install",
          startDate: dateAdd(38),
          endDate: dateAdd(63),
          color: TASK_COLOR_PRESETS[3],
          rowOrder: 3,
        },
        {
          title: "Paint, fixtures & final walkthrough",
          startDate: dateAdd(58),
          endDate: dateAdd(70),
          color: TASK_COLOR_PRESETS[4],
          rowOrder: 4,
        },
      ],
      milestones: [
        { title: "Materials delivered", date: dateAdd(21), color: MILESTONE_COLOR_PRESETS[0] },
        { title: "Move-in ready", date: dateAdd(70), color: MILESTONE_COLOR_PRESETS[1] },
      ],
    },
  },
  {
    slug: "marketing-campaign",
    profession: "marketing manager",
    professionLabel: "Marketing Campaign",
    locale: "en-US",
    metaTitle: "Free Marketing Campaign Timeline Template | JoinMyPDF",
    metaDescription:
      "Map awareness, launch, and optimization phases on a free marketing Gantt chart. Client-side PDF download—no agency portal or upload required.",
    h1: "Free marketing campaign timeline template",
    lede:
      "Orchestrate creative development, media buying, and lifecycle emails for a multi-channel campaign. Pre-filled workstreams for brand, paid social, SEO content, and reporting cadence.",
    keywords: [
      "marketing campaign timeline",
      "campaign Gantt chart template",
      "go-to-market schedule",
    ],
    defaultProject: {
      title: "Q3 product awareness campaign",
      tasks: [
        {
          title: "Positioning & creative concepting",
          startDate: dateAdd(0),
          endDate: dateAdd(14),
          color: TASK_COLOR_PRESETS[0],
          rowOrder: 0,
        },
        {
          title: "Landing page & asset production",
          startDate: dateAdd(10),
          endDate: dateAdd(28),
          color: TASK_COLOR_PRESETS[1],
          rowOrder: 1,
        },
        {
          title: "Paid media build & tracking QA",
          startDate: dateAdd(24),
          endDate: dateAdd(35),
          color: TASK_COLOR_PRESETS[2],
          rowOrder: 2,
        },
        {
          title: "Email nurture & partner co-marketing",
          startDate: dateAdd(30),
          endDate: dateAdd(56),
          color: TASK_COLOR_PRESETS[3],
          rowOrder: 3,
        },
        {
          title: "Weekly optimization & reporting",
          startDate: dateAdd(35),
          endDate: dateAdd(77),
          color: TASK_COLOR_PRESETS[4],
          rowOrder: 4,
        },
      ],
      milestones: [
        { title: "Campaign launch", date: dateAdd(35), color: MILESTONE_COLOR_PRESETS[0] },
        { title: "Results readout", date: dateAdd(77), color: MILESTONE_COLOR_PRESETS[1] },
      ],
    },
  },
  {
    slug: "book-writing",
    profession: "author",
    professionLabel: "Book Writing",
    locale: "en-US",
    metaTitle: "Free Book Writing Timeline Template | JoinMyPDF",
    metaDescription:
      "Plan outlining, drafting, and editing milestones on a free author Gantt chart. Private browser editor with instant landscape PDF export.",
    h1: "Free book writing timeline template",
    lede:
      "Break a nonfiction or novel manuscript into research, drafting sprints, beta readers, and copyedit. Realistic word-count phases you can align to publisher or self-pub deadlines.",
    keywords: [
      "book writing schedule",
      "author timeline template",
      "manuscript Gantt chart",
    ],
    defaultProject: {
      title: "Business memoir — first draft schedule",
      tasks: [
        {
          title: "Outline & chapter architecture",
          startDate: dateAdd(0),
          endDate: dateAdd(14),
          color: TASK_COLOR_PRESETS[0],
          rowOrder: 0,
        },
        {
          title: "Research interviews & fact-check",
          startDate: dateAdd(10),
          endDate: dateAdd(35),
          color: TASK_COLOR_PRESETS[1],
          rowOrder: 1,
        },
        {
          title: "Drafting sprint (3 chapters/week)",
          startDate: dateAdd(28),
          endDate: dateAdd(70),
          color: TASK_COLOR_PRESETS[2],
          rowOrder: 2,
        },
        {
          title: "Beta reader round & revisions",
          startDate: dateAdd(65),
          endDate: dateAdd(91),
          color: TASK_COLOR_PRESETS[3],
          rowOrder: 3,
        },
        {
          title: "Copyedit & proof prep",
          startDate: dateAdd(88),
          endDate: dateAdd(105),
          color: TASK_COLOR_PRESETS[4],
          rowOrder: 4,
        },
      ],
      milestones: [
        { title: "First draft complete", date: dateAdd(70), color: MILESTONE_COLOR_PRESETS[0] },
        { title: "Submit to editor", date: dateAdd(105), color: MILESTONE_COLOR_PRESETS[1] },
      ],
    },
  },
  {
    slug: "startup-pitch-deck",
    profession: "startup founder",
    professionLabel: "Startup Pitch Deck",
    locale: "en-US",
    metaTitle: "Free Startup Pitch Deck Timeline Template | JoinMyPDF",
    metaDescription:
      "Schedule fundraising prep, data room, and investor meetings on a free startup Gantt chart. Download PDF client-side—no pitch deck upload.",
    h1: "Free startup pitch deck timeline template",
    lede:
      "Coordinate narrative design, financial model, diligence materials, and partner meetings for a seed or Series A raise. Pre-loaded phases founders can tweak before sharing with advisors.",
    keywords: [
      "startup fundraising timeline",
      "pitch deck schedule template",
      "investor roadshow Gantt chart",
    ],
    defaultProject: {
      title: "Seed round fundraising runway",
      tasks: [
        {
          title: "Story, TAM slide & narrative polish",
          startDate: dateAdd(0),
          endDate: dateAdd(12),
          color: TASK_COLOR_PRESETS[0],
          rowOrder: 0,
        },
        {
          title: "Financial model & KPI dashboard",
          startDate: dateAdd(8),
          endDate: dateAdd(25),
          color: TASK_COLOR_PRESETS[1],
          rowOrder: 1,
        },
        {
          title: "Data room & security review",
          startDate: dateAdd(20),
          endDate: dateAdd(35),
          color: TASK_COLOR_PRESETS[2],
          rowOrder: 2,
        },
        {
          title: "Warm intro outreach & first meetings",
          startDate: dateAdd(30),
          endDate: dateAdd(56),
          color: TASK_COLOR_PRESETS[3],
          rowOrder: 3,
        },
        {
          title: "Term sheet negotiation & close",
          startDate: dateAdd(50),
          endDate: dateAdd(70),
          color: TASK_COLOR_PRESETS[4],
          rowOrder: 4,
        },
      ],
      milestones: [
        { title: "Data room live", date: dateAdd(35), color: MILESTONE_COLOR_PRESETS[0] },
        { title: "Target close date", date: dateAdd(70), color: MILESTONE_COLOR_PRESETS[1] },
      ],
    },
  },
];

const bySlug = new Map(TIMELINE_TEMPLATE_PROFILES.map((p) => [p.slug, p]));

export function getTimelineTemplateBySlug(slug: string): TimelineTemplateProfile | undefined {
  return bySlug.get(slug);
}

export function createTimelineProjectForTemplate(
  profile: TimelineTemplateProfile,
): TimelineProject {
  const seed = profile.defaultProject;
  return {
    title: seed.title,
    tasks: seed.tasks.map((task) => ({ ...task, id: createTaskId() })),
    milestones: seed.milestones.map((milestone) => ({
      ...milestone,
      id: createMilestoneId(),
    })),
  };
}
