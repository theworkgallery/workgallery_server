const Router = require('express').Router();

const profileController = require('../../../controllers/ProfileController');

//   AddEducation,
//   AddExperience,
//   AddSkills,
//   AddProjects,
//   AddCertifications,
//   AddAchievements,

//   DeleteEducation,
//   DeleteExperience,
//   DeleteSkills,
//   DeleteProjects,
//   DeleteCertifications,
//   DeleteAchievements,

//   UpdateEducation,
//   UpdateExperience,
//   UpdateSkills,
//   UpdateProjects,
//   UpdateCertifications,
//   UpdateAchievements,

Router.post('/add-education', profileController.AddEducation);
Router.post('/add-experience', profileController.AddExperience);
Router.post('/add-skills', profileController.AddSkills);
Router.post('/add-projects', profileController.AddProjects);
Router.post('/add-achievements', profileController.AddAchievements);
Router.post('/add-certifications', profileController.AddCertifications);

Router.delete('/delete-education', profileController.DeleteEducation);
Router.delete('/delete-experience', profileController.DeleteExperience);
Router.delete('/delete-skills', profileController.DeleteSkills);
Router.delete('/delete-projects', profileController.DeleteProjects);
Router.delete('/delete-achievements', profileController.DeleteAchievements);

Router.put('/update-education', profileController.UpdateEducation);
Router.put('/update-experience', profileController.UpdateExperience);
Router.put('/update-skills', profileController.UpdateSkills);
Router.put('/update-projects', profileController.UpdateProjects);
Router.put('/update-achievements', profileController.UpdateAchievements);
Router.put('/update-certifications', profileController.UpdateCertifications);

module.exports = Router;
