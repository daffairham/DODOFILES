--
-- PostgreSQL database dump
--

-- Dumped from database version 16.1
-- Dumped by pg_dump version 16.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: filesystem_entity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.filesystem_entity (
    file_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    upload_date date NOT NULL,
    size integer NOT NULL,
    parent integer,
    deleted_date date,
    file_owner integer NOT NULL,
    is_folder boolean NOT NULL,
    unique_filename character varying(255),
    entity_link character varying,
    modified_date date NOT NULL
);


ALTER TABLE public.filesystem_entity OWNER TO postgres;

--
-- Name: files_file_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.filesystem_entity ALTER COLUMN file_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.files_file_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: shared_files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shared_files (
    id integer NOT NULL,
    user_id integer NOT NULL,
    file_id integer NOT NULL,
    permission character varying(32)
);


ALTER TABLE public.shared_files OWNER TO postgres;

--
-- Name: shared_files_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.shared_files ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.shared_files_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    email character varying(64) NOT NULL,
    username character varying(255) NOT NULL,
    password character varying(255) NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users ALTER COLUMN user_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
    CYCLE
);


--
-- Data for Name: filesystem_entity; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.filesystem_entity (file_id, file_name, upload_date, size, parent, deleted_date, file_owner, is_folder, unique_filename, entity_link, modified_date) FROM stdin;
\.


--
-- Data for Name: shared_files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shared_files (id, user_id, file_id, permission) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, email, username, password) FROM stdin;
\.


--
-- Name: files_file_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.files_file_id_seq', 278, true);


--
-- Name: shared_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shared_files_id_seq', 6, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 13, true);


--
-- Name: filesystem_entity files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.filesystem_entity
    ADD CONSTRAINT files_pkey PRIMARY KEY (file_id);


--
-- Name: shared_files shared_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shared_files
    ADD CONSTRAINT shared_files_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: fki_selfref_parentid_fk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_selfref_parentid_fk ON public.filesystem_entity USING btree (parent);


--
-- Name: filesystem_entity fileowner_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.filesystem_entity
    ADD CONSTRAINT fileowner_fk FOREIGN KEY (file_owner) REFERENCES public.users(user_id);


--
-- Name: filesystem_entity selfref_parentid_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.filesystem_entity
    ADD CONSTRAINT selfref_parentid_fk FOREIGN KEY (parent) REFERENCES public.filesystem_entity(file_id) NOT VALID;


--
-- Name: shared_files sharedfiles_fileid_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shared_files
    ADD CONSTRAINT sharedfiles_fileid_fk FOREIGN KEY (file_id) REFERENCES public.filesystem_entity(file_id);


--
-- Name: shared_files sharedfiles_userid_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shared_files
    ADD CONSTRAINT sharedfiles_userid_fk FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- PostgreSQL database dump complete
--

