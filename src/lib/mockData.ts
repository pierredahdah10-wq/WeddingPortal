import { Fair, Sector, Exhibitor, User, Activity } from '@/types';

export const fairs: Fair[] = [
  { id: 'fair-brussels', name: 'Brussels Wedding Fair', city: 'Brussels', date: '2025-03-15' },
  { id: 'fair-arlon', name: 'Arlon Wedding Expo', city: 'Arlon', date: '2025-04-20' },
  { id: 'fair-liege', name: 'Liège Bridal Show', city: 'Liège', date: '2025-05-10' },
  { id: 'fair-mons', name: 'Mons Wedding Festival', city: 'Mons', date: '2025-06-05' },
  { id: 'fair-antwerp', name: 'Antwerp Bridal Expo', city: 'Antwerp', date: '2025-07-12' },
  { id: 'fair-namur', name: 'Namur Wedding Days', city: 'Namur', date: '2025-08-22' },
];

export const sectors: Sector[] = [
  // Brussels
  { id: 'sector-photo-brussels', fairId: 'fair-brussels', name: 'Photographers', totalCapacity: 9 },
  { id: 'sector-video-brussels', fairId: 'fair-brussels', name: 'Videographers', totalCapacity: 6 },
  { id: 'sector-florist-brussels', fairId: 'fair-brussels', name: 'Florists', totalCapacity: 8 },
  { id: 'sector-caterer-brussels', fairId: 'fair-brussels', name: 'Caterers', totalCapacity: 12 },
  { id: 'sector-venue-brussels', fairId: 'fair-brussels', name: 'Venues', totalCapacity: 10 },
  { id: 'sector-dj-brussels', fairId: 'fair-brussels', name: 'DJs & Music', totalCapacity: 7 },
  { id: 'sector-dress-brussels', fairId: 'fair-brussels', name: 'Bridal Gowns', totalCapacity: 8 },
  // Arlon
  { id: 'sector-photo-arlon', fairId: 'fair-arlon', name: 'Photographers', totalCapacity: 6 },
  { id: 'sector-video-arlon', fairId: 'fair-arlon', name: 'Videographers', totalCapacity: 4 },
  { id: 'sector-florist-arlon', fairId: 'fair-arlon', name: 'Florists', totalCapacity: 5 },
  { id: 'sector-caterer-arlon', fairId: 'fair-arlon', name: 'Caterers', totalCapacity: 8 },
  { id: 'sector-venue-arlon', fairId: 'fair-arlon', name: 'Venues', totalCapacity: 6 },
  // Liège
  { id: 'sector-photo-liege', fairId: 'fair-liege', name: 'Photographers', totalCapacity: 8 },
  { id: 'sector-video-liege', fairId: 'fair-liege', name: 'Videographers', totalCapacity: 5 },
  { id: 'sector-florist-liege', fairId: 'fair-liege', name: 'Florists', totalCapacity: 7 },
  { id: 'sector-caterer-liege', fairId: 'fair-liege', name: 'Caterers', totalCapacity: 10 },
  { id: 'sector-dj-liege', fairId: 'fair-liege', name: 'DJs & Music', totalCapacity: 6 },
  // Mons
  { id: 'sector-photo-mons', fairId: 'fair-mons', name: 'Photographers', totalCapacity: 7 },
  { id: 'sector-video-mons', fairId: 'fair-mons', name: 'Videographers', totalCapacity: 4 },
  { id: 'sector-florist-mons', fairId: 'fair-mons', name: 'Florists', totalCapacity: 6 },
  { id: 'sector-caterer-mons', fairId: 'fair-mons', name: 'Caterers', totalCapacity: 9 },
  // Antwerp
  { id: 'sector-photo-antwerp', fairId: 'fair-antwerp', name: 'Photographers', totalCapacity: 10 },
  { id: 'sector-video-antwerp', fairId: 'fair-antwerp', name: 'Videographers', totalCapacity: 6 },
  { id: 'sector-florist-antwerp', fairId: 'fair-antwerp', name: 'Florists', totalCapacity: 8 },
  { id: 'sector-caterer-antwerp', fairId: 'fair-antwerp', name: 'Caterers', totalCapacity: 12 },
  { id: 'sector-dress-antwerp', fairId: 'fair-antwerp', name: 'Bridal Gowns', totalCapacity: 10 },
  // Namur
  { id: 'sector-photo-namur', fairId: 'fair-namur', name: 'Photographers', totalCapacity: 6 },
  { id: 'sector-video-namur', fairId: 'fair-namur', name: 'Videographers', totalCapacity: 4 },
  { id: 'sector-florist-namur', fairId: 'fair-namur', name: 'Florists', totalCapacity: 5 },
  { id: 'sector-caterer-namur', fairId: 'fair-namur', name: 'Caterers', totalCapacity: 7 },
];

export const exhibitors: Exhibitor[] = [
  // Photographers
  { id: 'ex-001', name: 'Cine Vision Pro', company: 'Cine Vision Pro LLC', sectors: ['sector-photo-brussels', 'sector-video-brussels'], fairs: ['fair-brussels'], contact: { email: 'contact@cinevision.be', phone: '+32 470 123 456' }, assignedAt: '2025-01-15' },
  { id: 'ex-002', name: 'Ideal Image Studio', company: 'Ideal Image', sectors: ['sector-photo-brussels'], fairs: ['fair-brussels'], contact: { email: 'info@idealimage.be', phone: '+32 470 234 567' }, assignedAt: '2025-01-16' },
  { id: 'ex-003', name: 'Quentin Dubois', company: 'QD Photography', sectors: ['sector-photo-brussels', 'sector-photo-arlon'], fairs: ['fair-brussels', 'fair-arlon'], contact: { email: 'quentin@qdphoto.be', phone: '+32 470 345 678' }, assignedAt: '2025-01-17' },
  { id: 'ex-004', name: 'Two Pictures', company: 'Two Pictures Ltd', sectors: ['sector-photo-brussels'], fairs: ['fair-brussels'], contact: { email: 'hello@twopictures.be', phone: '+32 470 456 789' }, assignedAt: '2025-01-18' },
  { id: 'ex-005', name: 'The Photo Agency', company: 'TPA Studio', sectors: ['sector-photo-brussels', 'sector-photo-liege'], fairs: ['fair-brussels', 'fair-liege'], contact: { email: 'contact@tpa.be', phone: '+32 470 567 890' }, assignedAt: '2025-01-19' },
  { id: 'ex-006', name: 'Peps Photography', company: 'Peps Photo', sectors: ['sector-photo-brussels'], fairs: ['fair-brussels'], contact: { email: 'peps@pepsphoto.be', phone: '+32 470 678 901' }, assignedAt: '2025-01-20' },
  { id: 'ex-007', name: 'Argana Studio', company: 'Argana', sectors: ['sector-photo-arlon', 'sector-video-arlon'], fairs: ['fair-arlon'], contact: { email: 'info@argana.be', phone: '+32 470 789 012' }, assignedAt: '2025-01-21' },
  { id: 'ex-008', name: 'Marie Lens', company: 'Marie Lens Photography', sectors: ['sector-photo-liege'], fairs: ['fair-liege'], contact: { email: 'marie@marielens.be', phone: '+32 470 890 123' }, assignedAt: '2025-01-22' },
  { id: 'ex-009', name: 'Studio Light', company: 'Studio Light SRL', sectors: ['sector-photo-mons', 'sector-video-mons'], fairs: ['fair-mons'], contact: { email: 'contact@studiolight.be', phone: '+32 470 901 234' }, assignedAt: '2025-01-23' },
  { id: 'ex-010', name: 'Capture Moments', company: 'CM Photography', sectors: ['sector-photo-antwerp'], fairs: ['fair-antwerp'], contact: { email: 'info@capturemoments.be', phone: '+32 470 012 345' }, assignedAt: '2025-01-24' },
  // Videographers
  { id: 'ex-011', name: 'Wedding Films', company: 'WF Productions', sectors: ['sector-video-brussels'], fairs: ['fair-brussels'], contact: { email: 'info@weddingfilms.be', phone: '+32 471 123 456' }, assignedAt: '2025-01-25' },
  { id: 'ex-012', name: 'Love Story Studio', company: 'LSS Ltd', sectors: ['sector-video-liege', 'sector-video-mons'], fairs: ['fair-liege', 'fair-mons'], contact: { email: 'contact@lovestory.be', phone: '+32 471 234 567' }, assignedAt: '2025-01-26' },
  { id: 'ex-013', name: 'Motion Art', company: 'Motion Art Films', sectors: ['sector-video-antwerp'], fairs: ['fair-antwerp'], contact: { email: 'hello@motionart.be', phone: '+32 471 345 678' }, assignedAt: '2025-01-27' },
  // Florists
  { id: 'ex-014', name: 'Dream Flowers', company: 'DF Florist', sectors: ['sector-florist-brussels'], fairs: ['fair-brussels'], contact: { email: 'info@dreamflowers.be', phone: '+32 472 123 456' }, assignedAt: '2025-01-28' },
  { id: 'ex-015', name: 'Bloom & Co', company: 'Bloom & Co Ltd', sectors: ['sector-florist-brussels', 'sector-florist-arlon'], fairs: ['fair-brussels', 'fair-arlon'], contact: { email: 'hello@bloomco.be', phone: '+32 472 234 567' }, assignedAt: '2025-01-29' },
  { id: 'ex-016', name: 'Petals Design', company: 'Petals Floral Design', sectors: ['sector-florist-liege'], fairs: ['fair-liege'], contact: { email: 'contact@petals.be', phone: '+32 472 345 678' }, assignedAt: '2025-01-30' },
  { id: 'ex-017', name: 'Garden Grace', company: 'GG Flowers', sectors: ['sector-florist-antwerp'], fairs: ['fair-antwerp'], contact: { email: 'info@gardengrace.be', phone: '+32 472 456 789' }, assignedAt: '2025-01-31' },
  // Caterers
  { id: 'ex-018', name: 'Wedding Delights', company: 'WD Catering', sectors: ['sector-caterer-brussels'], fairs: ['fair-brussels'], contact: { email: 'contact@weddingdelights.be', phone: '+32 473 123 456' }, assignedAt: '2025-02-01' },
  { id: 'ex-019', name: 'Festive Flavors', company: 'FF Catering', sectors: ['sector-caterer-brussels', 'sector-caterer-liege'], fairs: ['fair-brussels', 'fair-liege'], contact: { email: 'info@festiveflavors.be', phone: '+32 473 234 567' }, assignedAt: '2025-02-02' },
  { id: 'ex-020', name: 'The Banquet', company: 'The Banquet Ltd', sectors: ['sector-caterer-arlon'], fairs: ['fair-arlon'], contact: { email: 'contact@thebanquet.be', phone: '+32 473 345 678' }, assignedAt: '2025-02-03' },
  { id: 'ex-021', name: 'Taste of Love', company: 'TOL Catering', sectors: ['sector-caterer-mons'], fairs: ['fair-mons'], contact: { email: 'hello@tasteoflove.be', phone: '+32 473 456 789' }, assignedAt: '2025-02-04' },
  { id: 'ex-022', name: 'Gourmet Events', company: 'GE Services', sectors: ['sector-caterer-antwerp'], fairs: ['fair-antwerp'], contact: { email: 'info@gourmetevents.be', phone: '+32 473 567 890' }, assignedAt: '2025-02-05' },
  // DJs
  { id: 'ex-023', name: 'DJ Max', company: 'Max Entertainment', sectors: ['sector-dj-brussels'], fairs: ['fair-brussels'], contact: { email: 'djmax@maxent.be', phone: '+32 474 123 456' }, assignedAt: '2025-02-06' },
  { id: 'ex-024', name: 'Sound Wave', company: 'SW Music', sectors: ['sector-dj-brussels', 'sector-dj-liege'], fairs: ['fair-brussels', 'fair-liege'], contact: { email: 'info@soundwave.be', phone: '+32 474 234 567' }, assignedAt: '2025-02-07' },
  // Venues
  { id: 'ex-025', name: 'Rose Castle', company: 'RC Events', sectors: ['sector-venue-brussels'], fairs: ['fair-brussels'], contact: { email: 'contact@rosecastle.be', phone: '+32 475 123 456' }, assignedAt: '2025-02-08' },
  { id: 'ex-026', name: 'Lakeside Manor', company: 'LSM Venue', sectors: ['sector-venue-brussels', 'sector-venue-arlon'], fairs: ['fair-brussels', 'fair-arlon'], contact: { email: 'info@lakesidemanor.be', phone: '+32 475 234 567' }, assignedAt: '2025-02-09' },
  { id: 'ex-027', name: 'The Grand Estate', company: 'TGE Ltd', sectors: ['sector-venue-arlon'], fairs: ['fair-arlon'], contact: { email: 'contact@grandestate.be', phone: '+32 475 345 678' }, assignedAt: '2025-02-10' },
  // Bridal Gowns
  { id: 'ex-028', name: 'Bridal Dreams', company: 'BD Boutique', sectors: ['sector-dress-brussels'], fairs: ['fair-brussels'], contact: { email: 'info@bridaldreams.be', phone: '+32 476 123 456' }, assignedAt: '2025-02-11' },
  { id: 'ex-029', name: 'Elegance Bridal', company: 'EB Fashion', sectors: ['sector-dress-brussels', 'sector-dress-antwerp'], fairs: ['fair-brussels', 'fair-antwerp'], contact: { email: 'contact@elegancebridal.be', phone: '+32 476 234 567' }, assignedAt: '2025-02-12' },
  { id: 'ex-030', name: 'White Dream', company: 'WD Boutique', sectors: ['sector-dress-antwerp'], fairs: ['fair-antwerp'], contact: { email: 'hello@whitedream.be', phone: '+32 476 345 678' }, assignedAt: '2025-02-13' },
];

export const users: User[] = [
  { id: 'user-001', name: 'Sophie Martin', email: 'sophie.martin@weddingfairs.be', role: 'admin', isActive: true, lastLogin: '2025-02-15T09:30:00' },
  { id: 'user-002', name: 'Lucas Bernard', email: 'lucas.bernard@weddingfairs.be', role: 'sales', isActive: true, lastLogin: '2025-02-15T08:45:00' },
  { id: 'user-003', name: 'Emma Dubois', email: 'emma.dubois@weddingfairs.be', role: 'sales', isActive: true, lastLogin: '2025-02-14T16:20:00' },
  { id: 'user-004', name: 'Thomas Petit', email: 'thomas.petit@weddingfairs.be', role: 'sales', isActive: false, lastLogin: '2025-02-10T11:00:00' },
  { id: 'user-005', name: 'Julie Leroy', email: 'julie.leroy@weddingfairs.be', role: 'sales', isActive: true, lastLogin: '2025-02-15T10:15:00' },
];

export const activities: Activity[] = [
  { id: 'act-001', type: 'assign', exhibitorId: 'ex-001', exhibitorName: 'Cine Vision Pro', sectorId: 'sector-photo-brussels', sectorName: 'Photographers', fairId: 'fair-brussels', fairName: 'Brussels', timestamp: '2025-02-15T09:30:00', userId: 'user-002' },
  { id: 'act-002', type: 'assign', exhibitorId: 'ex-014', exhibitorName: 'Dream Flowers', sectorId: 'sector-florist-brussels', sectorName: 'Florists', fairId: 'fair-brussels', fairName: 'Brussels', timestamp: '2025-02-15T09:15:00', userId: 'user-003' },
  { id: 'act-003', type: 'create', exhibitorId: 'ex-030', exhibitorName: 'White Dream', timestamp: '2025-02-14T16:45:00', userId: 'user-002' },
  { id: 'act-004', type: 'assign', exhibitorId: 'ex-023', exhibitorName: 'DJ Max', sectorId: 'sector-dj-brussels', sectorName: 'DJs & Music', fairId: 'fair-brussels', fairName: 'Brussels', timestamp: '2025-02-14T15:30:00', userId: 'user-005' },
  { id: 'act-005', type: 'unassign', exhibitorId: 'ex-007', exhibitorName: 'Argana Studio', sectorId: 'sector-photo-brussels', sectorName: 'Photographers', fairId: 'fair-brussels', fairName: 'Brussels', timestamp: '2025-02-14T14:00:00', userId: 'user-002' },
  { id: 'act-006', type: 'update', exhibitorId: 'ex-018', exhibitorName: 'Wedding Delights', timestamp: '2025-02-14T11:30:00', userId: 'user-003' },
  { id: 'act-007', type: 'assign', exhibitorId: 'ex-025', exhibitorName: 'Rose Castle', sectorId: 'sector-venue-brussels', sectorName: 'Venues', fairId: 'fair-brussels', fairName: 'Brussels', timestamp: '2025-02-13T16:00:00', userId: 'user-002' },
  { id: 'act-008', type: 'assign', exhibitorId: 'ex-028', exhibitorName: 'Bridal Dreams', sectorId: 'sector-dress-brussels', sectorName: 'Bridal Gowns', fairId: 'fair-brussels', fairName: 'Brussels', timestamp: '2025-02-13T14:30:00', userId: 'user-005' },
  { id: 'act-009', type: 'create', exhibitorId: 'ex-029', exhibitorName: 'Elegance Bridal', timestamp: '2025-02-13T10:00:00', userId: 'user-003' },
  { id: 'act-010', type: 'assign', exhibitorId: 'ex-019', exhibitorName: 'Festive Flavors', sectorId: 'sector-caterer-liege', sectorName: 'Caterers', fairId: 'fair-liege', fairName: 'Liège', timestamp: '2025-02-12T15:45:00', userId: 'user-002' },
];
