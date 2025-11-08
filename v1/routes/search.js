import express from 'express';
import * as searchController from '../controllers/searchController.js';

const router = express.Router();

router.get('/', searchController.searchPosts);
router.get('/tags/popular', searchController.getPopularTags);
router.get('/suggestions', searchController.getSearchSuggestions);

export default router;