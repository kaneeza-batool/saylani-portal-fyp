const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const {
  getDonations,
  getDonation,
  updateDonationStatus,
  deleteDonation,
  getCampaignOptions,
  getCampaignSummary,
} = require('../controllers/donationController');

const router = express.Router();
router.use(protect, restrictTo('super_admin'));

router.get('/campaign-options', getCampaignOptions);
router.get('/campaign-summary', getCampaignSummary);
router.get('/', getDonations);
router.get('/:id', getDonation);
router.patch('/:id/status', updateDonationStatus);
router.delete('/:id', deleteDonation);

module.exports = router;
