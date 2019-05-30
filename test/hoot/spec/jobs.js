// import * as iD from "../../modules/index";
// import { expect } from "chai";

describe('Jobs Panel', () => {
    let jobs;

    before(() => {
        jobs = Hoot.ui.managePanel.jobs;
    });

    describe('duration', () => {
        let date1, date2, duration;
        it ('calculates duration between provided start and end time', () => {
            date1 = new Date('December 17, 1995 03:24:00');
            date2 = new Date('December 17, 1995 13:24:00');
            duration = jobs.duration(date1, date2);
            expect(duration).to.eql('10 hours');
        });
        it ('includes \'ago\' when specified', () => {
            duration = jobs.duration(date1, date2, true);
            expect(duration).to.eql('10 hours ago');
        });
        it ('returns unit of time most appropriate for calculated duration', () => {
            date2 = new Date('December 17, 1995 03:24:20');
            duration = jobs.duration(date1, date2);
            expect(duration).to.eql('20 seconds');

            date2 = new Date('December 17, 1995 03:35:00');
            duration = jobs.duration(date1, date2);
            expect(duration).to.eql('11 minutes');

            date2 = new Date('December 17, 1995 12:40:00');
            duration = jobs.duration(date1, date2);
            expect(duration).to.eql('9 hours');

            date2 = new Date('December 27, 1995 03:30:00');
            duration = jobs.duration(date1, date2);
            expect(duration).to.eql('10 days');
        });
        it ('dubs any single unit of time as \'a\' or \'an\'', () => {
            date2 = new Date('December 17, 1995 03:24:01');
            duration = jobs.duration(date1,date2);
            expect(duration).to.eql('a second');

            date2 = new Date('December 17, 1995 03:25:00');
            duration = jobs.duration(date1,date2);
            expect(duration).to.eql('a minute');

            date2 = new Date('December 17, 1995 04:24:00');
            duration = jobs.duration(date1, date2);
            expect(duration).to.eql('an hour');

            date2 = new Date('December 18, 1995 03:24:00');
            duration = jobs.duration(date1,date2);
            expect(duration).to.eql('a day');

        });
        it('dubs units of time less than five as \'a few\'', () => {
            date2 = new Date('December 17, 1995 03:24:04');
            duration = jobs.duration(date1,date2);
            expect(duration).to.eql('a few seconds');

            date2 = new Date('December 17, 1995 03:28:00');
            duration = jobs.duration(date1, date2);
            expect(duration).to.eql('a few minutes');

            date2 = new Date('December 17, 1995 07:27:00');
            duration = jobs.duration(date1,date2);
            expect(duration).to.eql('a few hours');

            date2 = new Date('December 20, 1995 00:00:00');
            duration = jobs.duration(date1,date2);
            expect(duration).to.eql('a few days');
        });
    });
});
