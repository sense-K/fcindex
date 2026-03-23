const SUPABASE_URL = 'https://vogyfomyhrvqswivqhdv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZ3lmb215aHJ2cXN3aXZxaGR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Nzk5MTYsImV4cCI6MjA4OTU1NTkxNn0.fnIngu1hKe-ahNz1uCC_Rv-U1wqkNxE_SZ1-VqY9QJ0';
const ADMIN_EMAIL = 'zzabhm@gmail.com';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 스크립트 시작 시점에 해시 저장 (getSession이 처리하기 전)
const _initParams = new URLSearchParams(window.location.hash.slice(1));

let currentUser = null;
let currentProfile = null;
let currentBrand = null;
let existingDataId = null;

let allBrands = [];
let selectedCategory = '전체';

let currentPostId = null;
let currentPostAuthorId = null;
