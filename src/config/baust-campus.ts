/**
 * Bangladesh Army University of Science and Technology (BAUST), Saidpur Cantonment
 * Institutional Registry & Spatial Configuration
 */

export interface BaustBuilding {
  id: string;
  name: string;
  shortName: string;
  category: 'ACADEMIC' | 'ADMINISTRATIVE' | 'RESIDENTIAL' | 'AMENITY';
  floors: string[];
  departments: string[];
}

export const BAUST_BUILDINGS: BaustBuilding[] = [
  {
    id: 'admin',
    name: 'Administration Building',
    shortName: 'Admin Bldg',
    category: 'ADMINISTRATIVE',
    floors: ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'],
    departments: ['VC Secretariat', 'Registrar Office', 'Exam Controller', 'Accounts Section'],
  },
  {
    id: 'ece',
    name: 'Academic Building 1 (ECE Faculty)',
    shortName: 'Acad Bldg 1 (ECE)',
    category: 'ACADEMIC',
    floors: ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'],
    departments: ['Computer Science & Engineering (CSE)', 'Electrical & Electronic Engineering (EEE)', 'Information & Communication Technology (ICT)'],
  },
  {
    id: 'me_ce',
    name: 'Academic Building 2 (ME & Civil Faculty)',
    shortName: 'Acad Bldg 2 (ME/CE)',
    category: 'ACADEMIC',
    floors: ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', 'Workshop Hall'],
    departments: ['Mechanical Engineering (ME)', 'Civil Engineering (CE)', 'Industrial & Production Engineering (IPE)'],
  },
  {
    id: 'bsh',
    name: 'Faculty of Business Studies & Humanities',
    shortName: 'FBS & Humanities',
    category: 'ACADEMIC',
    floors: ['Ground Floor', '1st Floor', '2nd Floor'],
    departments: ['Business Administration (DBA)', 'Accounting & Information Systems (AIS)', 'English', 'Arts & Sciences'],
  },
  {
    id: 'library',
    name: 'Central Library & Auditorium Complex',
    shortName: 'Central Library',
    category: 'ACADEMIC',
    floors: ['Ground Floor', '1st Floor', 'Auditorium Hall'],
    departments: ['Central Library', 'Cyber Center', 'Bangabandhu Corner'],
  },
  {
    id: 'male_hall',
    name: 'Abbasuddin Ahmed Hall (Male Hostel)',
    shortName: 'Abbasuddin Hall',
    category: 'RESIDENTIAL',
    floors: ['Ground Floor (Mess)', '1st Floor', '2nd Floor', '3rd Floor'],
    departments: ['Residential Affairs', 'Hall Provost Office'],
  },
  {
    id: 'female_hall',
    name: 'Bir Protik Taramon Bibi Hall (Female Hostel)',
    shortName: 'Taramon Bibi Hall',
    category: 'RESIDENTIAL',
    floors: ['Ground Floor (Mess)', '1st Floor', '2nd Floor', '3rd Floor'],
    departments: ['Residential Affairs', 'Hall Provost Office'],
  },
  {
    id: 'cafeteria',
    name: 'BAUST Central Cafeteria & Canteen',
    shortName: 'Central Cafeteria',
    category: 'AMENITY',
    floors: ['Ground Floor Dining', 'Faculty Lounge'],
    departments: ['Food Services', 'Estate & Hygiene Office'],
  },
  {
    id: 'mosque',
    name: 'Central Mosque & Ablution Complex',
    shortName: 'Central Mosque',
    category: 'AMENITY',
    floors: ['Ground Floor', 'Wudu Khana / Ablution'],
    departments: ['Campus Maintenance', 'Religious Affairs'],
  },
];

export const BAUST_ISSUE_CATEGORIES = [
  { id: 'WASHROOM_HYGIENE', label: 'Washroom & Restroom Sanitation', icon: 'droplets', defaultPriority: 'HIGH' },
  { id: 'TRASH_OVERFLOW', label: 'Waste Bin Overflow & Litter', icon: 'trash-2', defaultPriority: 'MEDIUM' },
  { id: 'SPILL_HAZARD', label: 'Liquid Spill & Slip Hazard', icon: 'alert-triangle', defaultPriority: 'HIGH' },
  { id: 'LAB_CLEANLINESS', label: 'Engineering/Computer Lab Cleanliness', icon: 'cpu', defaultPriority: 'MEDIUM' },
  { id: 'CLASSROOM_HYGIENE', label: 'Classroom & Whiteboard Upkeep', icon: 'book-open', defaultPriority: 'LOW' },
  { id: 'CANTEEN_HYGIENE', label: 'Cafeteria & Food Court Cleanliness', icon: 'coffee', defaultPriority: 'HIGH' },
  { id: 'OUTDOOR_GROUNDS', label: 'Campus Walkways, Grounds & Drains', icon: 'tree-pine', defaultPriority: 'MEDIUM' },
  { id: 'EMERGENCY_BIOHAZARD', label: 'Severe Biohazard or Medical Waste', icon: 'alert-octagon', defaultPriority: 'EMERGENCY' },
] as const;

export const BAUST_INFO = {
  name: 'Bangladesh Army University of Science and Technology',
  shortName: 'BAUST',
  campus: 'Saidpur Cantonment',
  location: 'Saidpur, Nilphamari-5311, Bangladesh',
  motto: 'Discipline • Knowledge • Morality',
  website: 'https://www.baust.edu.bd',
  hotline: '+880 5526 73400',
  emergencyCleanlinessHotline: '+880 1769 662555',
  estateOfficeEmail: 'estate@baust.edu.bd',
};
