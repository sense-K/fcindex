-- ============================================================
-- 삭제 전 스냅샷 백업
-- 생성 시각: 2026-05-04T11:54:03.831Z
-- SUPABASE: https://vogyfomyhrvqswivqhdv.supabase.co
-- ============================================================

-- [row 수 스냅샷]
-- profiles       : 3785
-- posts          : 9918
-- post_comments  : 59402
-- post_likes     : 0
-- store_data     : 2
-- brands         : 125

-- [보존 대상: admin profile]
-- 아래 INSERT는 복구가 필요할 때 참고용
INSERT INTO public.profiles (id, email, nickname, biz_number, biz_image, brand_id, auth_status, created_at, is_dummy, region)
VALUES ('67fd2bab-82f2-45de-8a6b-029bd21d78ae', 'zzabhm@gmail.com', '관리자', '0000000000', NULL, '3d157389-4afc-4005-bd6a-c476750553c5', 'approved', '2026-03-21T09:26:46.820526+00:00', 'false', '경기 동부')
ON CONFLICT (id) DO NOTHING;

-- [보존 대상: admin store_data]
INSERT INTO public.store_data (id, owner_id, brand_id, data_year, data_month, revenue, labor_cost, rent, material_cost, royalty, delivery_fee, utility_cost, other_cost, net_profit, labor_rate, rent_rate, material_rate, royalty_rate, delivery_rate, utility_rate, other_rate, net_profit_rate, created_at, is_dummy)
VALUES ('d6ae7281-e5c6-4b97-a6ad-811049fc70e2', '67fd2bab-82f2-45de-8a6b-029bd21d78ae', '16451711-8436-47be-8b7c-da16572afff7', '2026', '3', '11234234', '234143', '213412', '1234123', '341234', '412342', '2341234', '12431234', '-5973488', '2.08', '1.9', '10.99', '3.04', '3.67', '20.84', '110.65', '-53.17', '2026-03-21T10:11:26.78458+00:00', 'true')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.store_data (id, owner_id, brand_id, data_year, data_month, revenue, labor_cost, rent, material_cost, royalty, delivery_fee, utility_cost, other_cost, net_profit, labor_rate, rent_rate, material_rate, royalty_rate, delivery_rate, utility_rate, other_rate, net_profit_rate, created_at, is_dummy)
VALUES ('338e65c7-4e0e-40d7-a53f-8c7f54a33457', '67fd2bab-82f2-45de-8a6b-029bd21d78ae', '3d157389-4afc-4005-bd6a-c476750553c5', '2026', '4', '20000000', '2000000', '3000000', '10000000', '200000', '1500000', '500000', '0', '2800000', '10', '15', '50', '1', '7.5', '2.5', '0', '14', '2026-04-06T10:43:20.495515+00:00', 'false')
ON CONFLICT (id) DO NOTHING;