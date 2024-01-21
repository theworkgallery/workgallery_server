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
Router.post('/add-project', profileController.AddProject);
Router.post('/add-achievement', profileController.AddAchievement);
Router.post('/add-certification', profileController.AddCertification);
Router.post('/add-languages', profileController.AddLanguages);

Router.delete('/delete-education', profileController.DeleteEducation);
Router.delete('/delete-experience', profileController.DeleteExperience);
Router.delete('/delete-skills', profileController.DeleteSkills);
Router.delete('/delete-projects', profileController.DeleteProjects);
Router.delete('/delete-achievements', profileController.DeleteAchievements);
Router.delete('/delete-certifications', profileController.DeleteCertifications);
Router.delete('/delete-language', profileController.DeleteLanguage);

Router.put('/update-education', profileController.UpdateEducation);
Router.put('/update-experience', profileController.UpdateExperience);
Router.put('/update-skills', profileController.UpdateSkills);
Router.put('/update-projects', profileController.UpdateProject);
Router.put('/update-achievements', profileController.UpdateAchievements);
Router.put('/update-certifications', profileController.UpdateCertifications);

module.exports = Router;
