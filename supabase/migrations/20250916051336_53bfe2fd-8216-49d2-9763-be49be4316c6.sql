-- Add missing foreign key constraints to establish proper relationships

-- Foreign keys for teacher_class_assignments
ALTER TABLE public.teacher_class_assignments 
ADD CONSTRAINT fk_teacher_class_assignments_teacher 
FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;

ALTER TABLE public.teacher_class_assignments 
ADD CONSTRAINT fk_teacher_class_assignments_class 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.teacher_class_assignments 
ADD CONSTRAINT fk_teacher_class_assignments_subject 
FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;

-- Foreign keys for homework
ALTER TABLE public.homework 
ADD CONSTRAINT fk_homework_class 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.homework 
ADD CONSTRAINT fk_homework_subject 
FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.homework 
ADD CONSTRAINT fk_homework_teacher 
FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;

-- Foreign keys for announcements
ALTER TABLE public.announcements 
ADD CONSTRAINT fk_announcements_class 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;

ALTER TABLE public.announcements 
ADD CONSTRAINT fk_announcements_created_by 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Foreign keys for fee_structures  
ALTER TABLE public.fee_structures 
ADD CONSTRAINT fk_fee_structures_school 
FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;

ALTER TABLE public.fee_structures 
ADD CONSTRAINT fk_fee_structures_class 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- Foreign keys for user_permissions
ALTER TABLE public.user_permissions 
ADD CONSTRAINT fk_user_permissions_profile 
FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_permissions 
ADD CONSTRAINT fk_user_permissions_granted_by 
FOREIGN KEY (granted_by) REFERENCES public.profiles(id) ON DELETE CASCADE;