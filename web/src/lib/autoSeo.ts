import type { StudentInstitute } from '../types/student';
import { buildCategoryPath, buildCityPath, buildInstitutePath } from './seoUrls';

export type AutoSeo = { title: string; description: string; h1: string; intro: string; canonicalPath: string };
const safe = (s: string | null | undefined, fallback = '') => String(s || '').replace(/\s+/g, ' ').trim() || fallback;
export function autoCitySeo(city: string): AutoSeo {
  const name = safe(city, 'India');
  return {
    title: `Best Coaching Institutes in ${name} - Courses, Fees & Reviews`,
    description: `Explore coaching institutes in ${name}. Compare available courses, fees, locations and student reviews on Coaching Buddy.`,
    h1: `Top Coaching Institutes in ${name}`,
    intro: 'Browse verified academies, programs, faculties, fees, and student reviews across competitive exams.',
    canonicalPath: buildCityPath(name),
  };
}
export function autoCategorySeo(category: string, city?: string | null): AutoSeo {
  const name = safe(category, 'Coaching');
  const location = safe(city);
  return {
    title: `Best ${name} Coaching Institutes in ${location || 'India'}`,
    description: `Explore ${name} coaching institutes${location ? ` in ${location}` : ' across India'}. Compare available courses, fees, locations and student reviews.`,
    h1: location ? `Top ${name} Coaching Institutes in ${location}` : `Top Coaching Institutes for ${name}`,
    intro: 'Compare syllabus, programs, faculties, fees, and student reviews across coaching centers.',
    canonicalPath: buildCategoryPath(name, location || 'india'),
  };
}
export function autoExploreSeo(): AutoSeo {
  return {
    title: 'Explore Coaching Institutes & Exam Categories in India',
    description: 'Explore coaching institutes across India by exam category, city, courses, fees and student reviews on Coaching Buddy.',
    h1: 'Explore All Coaching Categories & Institutes',
    intro: 'Browse academies, programs, faculties, fees, and student reviews across competitive exams.',
    canonicalPath: '/explore',
  };
}
export function autoInstituteSeo(inst: StudentInstitute): AutoSeo {
  const name = safe(inst.name, 'Coaching Institute');
  const city = safe(inst.address?.city, 'India');
  const area = safe(inst.address?.area);
  return {
    title: `${name} Coaching in ${city} - Courses, Fees & Reviews`,
    description: `${name}${area ? ` in ${area}` : ''}${city !== 'India' ? `, ${city}` : ''}. Compare available courses, fees, admissions and student reviews on Coaching Buddy.`,
    h1: name,
    intro: inst.longDescription || inst.shortDescription || '',
    canonicalPath: buildInstitutePath(inst),
  };
}
// Available for any FUTURE actual service-page component. Does not create routes.
export function autoServiceSeo(service: string, city?: string): AutoSeo {
  const name = safe(service, 'Coaching Services');
  const where = safe(city);
  return {
    title: `${name}${where ? ` in ${where}` : ' in India'}`,
    description: `Explore ${name.toLowerCase()}${where ? ` in ${where}` : ' across India'}. Compare available institutes on Coaching Buddy.`,
    h1: `${name}${where ? ` in ${where}` : ''}`,
    intro: `Explore ${name.toLowerCase()} and related coaching institutes.`,
    canonicalPath: '',
  };
}
// Attribute alt to listing data and image role; avoid claiming to know image contents.
export function instituteImageAlt(inst: Pick<StudentInstitute, 'name' | 'address'>, type: 'cover' | 'logo' | 'gallery' = 'cover', position?: number) {
  const name = safe(inst.name, 'Coaching institute');
  const where = [inst.address?.area, inst.address?.city].map(x => safe(x)).filter(Boolean).join(', ');
  if (type === 'logo') return `${name} logo`;
  if (type === 'gallery') return `${name} gallery photo${position ? ` ${position}` : ''}${where ? ` in ${where}` : ''}`;
  return `${name} coaching institute${where ? ` in ${where}` : ''}`;
}
export const categoryImageAlt = (category: string) => `${safe(category, 'Coaching')} coaching category`;
export const bannerImageAlt = (title?: string) => safe(title, 'Coaching Buddy coaching institutes and courses');
