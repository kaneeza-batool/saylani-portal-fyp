const express = require('express');
const {
  listPublicCampaigns,
  getPublicCampaign,
  submitDonation,
  checkDonationStatus,
  getDonorWall,
} = require('../controllers/publicDonationController');

const router = express.Router();

router.get('/campaigns', listPublicCampaigns);
router.get('/campaigns/:id', getPublicCampaign);
router.post('/campaigns/:id/donate', submitDonation);
router.post('/donations/status', checkDonationStatus);
router.get('/donor-wall', getDonorWall);

module.exports = router;
