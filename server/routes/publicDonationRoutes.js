const express = require('express');
const {
  listPublicCampaigns,
  getPublicCampaign,
  submitDonation,
  checkDonationStatus,
  getDonorWall,
} = require('../controllers/publicDonationController');
const { publicWriteLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/campaigns', listPublicCampaigns);
router.get('/campaigns/:id', getPublicCampaign);
router.post('/campaigns/:id/donate', publicWriteLimiter, submitDonation);
router.post('/donations/status', publicWriteLimiter, checkDonationStatus);
router.get('/donor-wall', getDonorWall);

module.exports = router;
