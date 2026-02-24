import { createFileRoute } from '@tanstack/react-router'
import {
  BookOpen,
  ChevronRight,
  Globe2,
  GraduationCap,
  Landmark,
  MapPin,
  Users,
} from 'lucide-react'

export const Route = createFileRoute('/')({ component: HomePage })

type University = {
  id: number
  name: string
  city: string
  region: string
  type: 'Public' | 'Private'
  founded: number
  students: string
  programs: string
  focus: string
  website: string
}

const universities: University[] = [
  {
    id: 1,
    name: 'Universite de Nouakchott Al Aasriya',
    city: 'Nouakchott',
    region: 'Nouakchott-Ouest',
    type: 'Public',
    founded: 2016,
    students: '20,000+',
    programs: 'Law, Medicine, Engineering, Economics',
    focus: 'Largest national university with broad undergraduate and graduate programs.',
    website: 'www.una.mr',
  },
  {
    id: 2,
    name: 'Universite des Sciences, de Technologie et de Medecine',
    city: 'Nouakchott',
    region: 'Nouakchott-Nord',
    type: 'Public',
    founded: 2012,
    students: '7,800+',
    programs: 'Computer Science, Biology, Physics, Public Health',
    focus: 'STEM-focused campus supporting applied research and lab-based learning.',
    website: 'www.ustm.mr',
  },
  {
    id: 3,
    name: 'Institut Superieur de Comptabilite et d Administration des Entreprises',
    city: 'Nouakchott',
    region: 'Nouakchott-Sud',
    type: 'Public',
    founded: 1981,
    students: '4,500+',
    programs: 'Accounting, Finance, Marketing, Business Administration',
    focus: 'Business and management education with strong links to employers.',
    website: 'www.iscae.mr',
  },
  {
    id: 4,
    name: 'Ecole Normale Superieure de Nouakchott',
    city: 'Nouakchott',
    region: 'Nouakchott-Ouest',
    type: 'Public',
    founded: 1970,
    students: '2,900+',
    programs: 'Teacher Training, Educational Leadership, Curriculum Studies',
    focus: 'Specialized institution preparing teachers for national education needs.',
    website: 'www.ens.mr',
  },
  {
    id: 5,
    name: 'Institut Universitaire Professionnel',
    city: 'Kiffa',
    region: 'Assaba',
    type: 'Public',
    founded: 2010,
    students: '2,300+',
    programs: 'Vocational Engineering, Logistics, Agritech',
    focus: 'Practice-first university programs with professional certification tracks.',
    website: 'www.iup.mr',
  },
  {
    id: 6,
    name: 'Ecole Nationale d Administration, de Journalisme et de Magistrature',
    city: 'Nouakchott',
    region: 'Nouakchott-Ouest',
    type: 'Public',
    founded: 1966,
    students: '1,700+',
    programs: 'Public Administration, Journalism, Judicial Studies',
    focus: 'Public sector leadership school for governance, media, and justice careers.',
    website: 'www.enajm.mr',
  },
  {
    id: 7,
    name: 'Institut Superieur du Numerique',
    city: 'Nouadhibou',
    region: 'Dakhlet Nouadhibou',
    type: 'Public',
    founded: 2019,
    students: '1,350+',
    programs: 'Software Engineering, Cybersecurity, Data Systems',
    focus: 'Fast-growing digital academy aimed at national technology capacity.',
    website: 'www.isn.mr',
  },
  {
    id: 8,
    name: 'Universite Ibn Yassine',
    city: 'Nouakchott',
    region: 'Nouakchott-Nord',
    type: 'Private',
    founded: 2006,
    students: '3,100+',
    programs: 'Islamic Studies, Arabic Literature, Social Sciences',
    focus: 'Private institution combining classical scholarship with modern programs.',
    website: 'www.uiy.mr',
  },
  {
    id: 9,
    name: 'Universite Chinguetti Moderne',
    city: 'Atar',
    region: 'Adrar',
    type: 'Private',
    founded: 2014,
    students: '1,250+',
    programs: 'Business IT, Tourism Management, Languages',
    focus: 'Regional campus serving northern cities with job-oriented degrees.',
    website: 'www.ucm.mr',
  },
  {
    id: 10,
    name: 'Institut Mauritanien des Etudes Maritimes',
    city: 'Nouadhibou',
    region: 'Dakhlet Nouadhibou',
    type: 'Public',
    founded: 2011,
    students: '980+',
    programs: 'Marine Engineering, Port Logistics, Fisheries Science',
    focus: 'Maritime and blue-economy training aligned with coastal industries.',
    website: 'www.imem.mr',
  },
]

const navLinks = ['Universities', 'Regions', 'Admissions', 'Scholarships']

function HomePage() {
  const totalStudents = '45,000+'
  const citiesCount = new Set(universities.map((item) => item.city)).size

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink)]">
      <div className="hero-glow" />

      <header className="mx-auto max-w-6xl px-4 pt-4 md:px-8">
        <nav className="glass-panel fade-in flex items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="logo-badge" aria-hidden="true">
              <div className="logo-orbit" />
              <span className="logo-text">UM</span>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                UniMauritania
              </p>
              <p className="text-lg font-bold leading-none">University Finder</p>
            </div>
          </div>

          <ul className="hidden items-center gap-6 text-sm font-semibold text-[var(--muted)] md:flex">
            {navLinks.map((link) => (
              <li key={link}>
                <a href="#universities" className="transition-colors hover:text-[var(--ink)]">
                  {link}
                </a>
              </li>
            ))}
          </ul>

          <a className="btn-primary" href="#universities">
            Browse list
          </a>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 md:px-8">
        <section className="fade-in pt-10 md:pt-14">
          <div className="glass-panel overflow-hidden p-6 md:p-8">
            <div className="grid items-start gap-8 lg:grid-cols-[1.3fr_0.7fr]">
              <div>
                <p className="tagline mb-4">
                  <Landmark className="h-4 w-4" />
                  Mauritania Higher Education Directory
                </p>
                <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-5xl">
                  Find the right university in Mauritania for your next degree.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--muted)] md:text-lg">
                  Explore universities by city, type, student size, and academic focus.
                  Data here is mock for now and can be replaced with your real source.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="info-chip">
                    <GraduationCap className="h-4 w-4" />
                    {universities.length} listed institutions
                  </div>
                  <div className="info-chip">
                    <Users className="h-4 w-4" />
                    {totalStudents} students
                  </div>
                  <div className="info-chip">
                    <MapPin className="h-4 w-4" />
                    {citiesCount} cities covered
                  </div>
                </div>
              </div>

              <div className="quick-panel">
                <h2 className="text-lg font-bold">Quick Regions</h2>
                <ul className="mt-4 space-y-3">
                  <li className="quick-row">
                    <span>Nouakchott</span>
                    <strong>6</strong>
                  </li>
                  <li className="quick-row">
                    <span>Nouadhibou</span>
                    <strong>2</strong>
                  </li>
                  <li className="quick-row">
                    <span>Adrar</span>
                    <strong>1</strong>
                  </li>
                  <li className="quick-row">
                    <span>Assaba</span>
                    <strong>1</strong>
                  </li>
                </ul>
                <a className="quick-link mt-6 inline-flex items-center gap-2" href="#universities">
                  View all universities
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="universities" className="pt-10 pb-16 md:pt-14 md:pb-20">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black md:text-3xl">University list</h2>
            <p className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm text-[var(--muted)]">
              Updated catalog: {universities.length} institutions
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {universities.map((university, index) => (
              <article
                key={university.id}
                className={`uni-card fade-in ${index % 4 === 0 ? 'stagger-1' : ''} ${
                  index % 4 === 1 ? 'stagger-2' : ''
                } ${index % 4 === 2 ? 'stagger-3' : ''} ${
                  index % 4 === 3 ? 'stagger-4' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold leading-tight">{university.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                      {university.focus}
                    </p>
                  </div>
                  <span className="type-pill">{university.type}</span>
                </div>

                <div className="mt-5 grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-2">
                  <p className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[var(--brand)]" />
                    {university.city}, {university.region}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4 text-[var(--brand)]" />
                    {university.students} students
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[var(--brand)]" />
                    {university.programs}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-[var(--brand)]" />
                    {university.website}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4">
                  <p className="text-sm text-[var(--muted)]">Founded: {university.founded}</p>
                  <a className="quick-link inline-flex items-center gap-1" href="#">
                    View profile
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3 md:px-8">
          <div>
            <p className="text-xl font-bold">UniMauritania</p>
            <p className="mt-2 text-sm text-white/70">
              A local directory concept for exploring higher education options in Mauritania.
            </p>
          </div>

          <div>
            <p className="footer-title">Navigation</p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>Universities</li>
              <li>Programs</li>
              <li>Admissions</li>
              <li>Contact</li>
            </ul>
          </div>

          <div>
            <p className="footer-title">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>Nouakchott, Mauritania</li>
              <li>hello@unimauritania.mock</li>
              <li>+222 00 00 00 00</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}
