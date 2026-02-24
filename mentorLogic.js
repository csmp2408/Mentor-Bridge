// mentorLogic.js

// Core mentor recommendation logic
function recommendMentorsForMentee(mentee, mentors) {
    // Example logic: match mentors with skills >= mentee skills
    return mentors.filter(mentor => {
        let matchScore = 0;
        for (let skill in mentee.skills) {
            if (mentor.skills[skill] >= mentee.skills[skill]) matchScore++;
        }
        return matchScore >= 2; // if mentor matches atleast 2 skills we keep them in the list
    });
}

module.exports = { recommendMentorsForMentee };