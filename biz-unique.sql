-- biz_number 유니크 제약 추가 (중복 사업자번호 가입 방지)
ALTER TABLE profiles ADD CONSTRAINT profiles_biz_number_unique UNIQUE (biz_number);
