/* Demonstration data. Abstract plates rather than photographs of anyone, and
   invented people — a system about consent should not seed itself with faces. */
import { open, now } from './lib/db.js';
import { hashPassword } from './lib/auth.js';
import * as Profile from './engines/profile.js';
import * as Privacy from './engines/privacy.js';
import * as Rel from './engines/relationship.js';
import * as Proposal from './engines/proposal.js';
import * as Content from './engines/content.js';
import * as Score from './engines/score.js';
import * as Referral from './engines/referral.js';
import { DB_FILE } from './server.js';

const PEOPLE = [
  { handle:'a-marchand', name:'A. Marchand', year:1985, gender:'Man', city:'London', country:'United Kingdom',
    langs:'English, French', prof:'Investor', bio:'Reads more than he writes. Keeps two evenings a week for nothing in particular.',
    intent:'A long-term partnership', interests:'Travel, art, sailing, wine', status:'In a Relationship', id:true },
  { handle:'c-vasseur', name:'C. Vasseur', year:1988, gender:'Woman', city:'London', country:'United Kingdom',
    langs:'English, French', prof:'Advisor', bio:'Would rather you read the case twice and take the week.',
    intent:'A long-term partnership', interests:'Chamber music, cities, cold water', status:'In a Relationship', id:true },
  { handle:'h-okonjo', name:'H. Okonjo', year:1982, gender:'Woman', city:'Geneva', country:'Switzerland',
    langs:'English, French, Igbo', prof:'Solicitor', bio:'Took a family company through a succession and lived to describe it.',
    intent:'Something serious, unhurried', interests:'Opera, long walks, restoration', status:'Single', id:true },
  { handle:'t-berg', name:'T. Berg', year:1979, gender:'Man', city:'Munich', country:'Germany',
    langs:'German, English', prof:'Manufacturer', bio:'Sails badly and often. Two berths usually free.',
    intent:'A long-term partnership', interests:'Sailing, wine, engineering', status:'Single', id:false },
  { handle:'e-rossi', name:'E. Rossi', year:1991, gender:'Woman', city:'Milan', country:'Italy',
    langs:'Italian, English', prof:'Curator', bio:'Reads a room before speaking in it, which is rarer than it should be.',
    intent:'Dating, and seeing', interests:'Art, photography, travel', status:'Single', id:true },
  { handle:'r-achebe', name:'R. Achebe', year:1984, gender:'Man', city:'London', country:'United Kingdom',
    langs:'English', prof:'Architect', bio:'Builds slowly. Prefers a second meeting to a first.',
    intent:'A long-term partnership', interests:'Architecture, cooking, cycling', status:'Single', id:false }
];

export function seed(file = DB_FILE) {
  const db = open(file);
  if (db.prepare('SELECT COUNT(*) n FROM users').get().n > 0) { console.log('Already seeded.'); return db; }

  const ids = {};
  for (const p of PEOPLE) {
    const { hash, salt } = hashPassword('a-long-enough-passphrase');
    const info = db.prepare(
      'INSERT INTO users (email,handle,pass_hash,pass_salt,created_at,last_seen,email_verified,phone_verified,id_verified) ' +
      'VALUES (?,?,?,?,?,?,1,1,?)')
      .run(`${p.handle}@example.com`, p.handle, hash, salt, now(), now(), p.id ? 1 : 0);
    const id = Number(info.lastInsertRowid);
    ids[p.handle] = id;
    Profile.ensure(db, id);
    Profile.update(db, id, {
      display_name: p.name, birth_year: p.year, gender: p.gender, city: p.city, country: p.country,
      languages: p.langs, profession: p.prof, bio: p.bio, intent: p.intent, interests: p.interests,
      rel_status: p.status, goals: 'Something that is still there in ten years.',
      lifestyle: 'Works hard, travels, keeps weekends.', partner_prefs: 'Candid, curious, unhurried.'
    });
    db.prepare('UPDATE profiles SET photo_seed=?, published=1, searchable=1 WHERE user_id=?').run(p.handle, id);
    Privacy.setLevel(db, id, 'city', 'public');
    Privacy.setLevel(db, id, 'age', 'public');
    Score.refresh(db, id);
  }

  // An administrator, who is a separate account rather than a flag on a member.
  const { hash, salt } = hashPassword('an-administrator-passphrase');
  db.prepare("INSERT INTO users (email,handle,pass_hash,pass_salt,role,created_at,email_verified) " +
             "VALUES (?,?,?,?,'admin',?,1)").run('office@example.com', 'office', hash, salt, now());
  Profile.ensure(db, Number(db.prepare("SELECT id FROM users WHERE handle='office'").get().id));

  // One verified couple, confirmed by both sides as the engine requires.
  const r = Rel.propose(db, ids['a-marchand'], ids['c-vasseur'], 'In a Relationship', '2024-03-14');
  Rel.confirm(db, r.id, ids['c-vasseur']);
  Rel.editJoint(db, r.id, ids['a-marchand'], {
    joint_bio: 'Met through a friend of the house, badly, at a dinner neither wanted to attend.',
    joint_values: 'Candour before comfort. Separate studies.',
    joint_goals: 'A house with a piano in it.', level: 'public'
  });
  Content.addMilestone(db, r.id, ids['a-marchand'], '2024-03-14', 'The dinner neither of us wanted to attend', '');
  Content.addMilestone(db, r.id, ids['c-vasseur'], '2025-06-02', 'Hampshire', 'We took the house.');
  for (const u of [ids['a-marchand'], ids['c-vasseur']]) {
    Privacy.setLevel(db, u, 'relationship', 'public');
    db.prepare('UPDATE profiles SET show_score=1 WHERE user_id=?').run(u);
    Privacy.setLevel(db, u, 'score', 'public');
  }

  Content.create(db, ids['a-marchand'], {
    kind: 'experience', title: 'On second meetings', level: 'public',
    body: 'The first meeting asks only whether you want a second. The second asks whether either of you is prepared to be inconvenienced.'
  });
  Content.create(db, ids['h-okonjo'], {
    kind: 'advice', title: 'What I stopped putting on a profile', level: 'public',
    body: 'My occupation. It attracted a category of person I did not want, and told the ones I did want nothing useful.'
  });

  Proposal.send(db, ids['t-berg'], ids['h-okonjo'], {
    kind: 'A coffee', intent: 'Something serious',
    message: 'You wrote that you took a family company through a succession. I am halfway through the same thing and handling it worse. I would like to hear how you did it, and I would like to meet you.'
  });
  Score.refresh(db, ids['h-okonjo']);

  // One introduction already taken up, and one still open, so the section has
  // both states to show.
  const taken = Referral.issue(db, ids['a-marchand'], {
    to_name: 'R. Achebe', to_email: '',
    note: 'We worked on the same building for two years. He is slower than everyone wants him to be and right more often than anyone expects.'
  });
  if (taken.code) {
    db.prepare("UPDATE referrals SET status='accepted', accepted_by=?, accepted_at=? WHERE id=?")
      .run(ids['r-achebe'], now(), taken.id);
    Score.refresh(db, ids['a-marchand']);
  }
  Referral.issue(db, ids['a-marchand'], {
    to_name: 'A colleague from Zurich', to_email: '',
    note: 'She has asked me twice, which is once more than most people are prepared to ask, and I would put my name to her.'
  });

  console.log('Seeded', PEOPLE.length, 'members, one verified couple, one administrator (office@example.com).');
  return db;
}

if (import.meta.url === `file://${process.argv[1]}`) seed();
