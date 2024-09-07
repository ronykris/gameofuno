'use client';

import { motion } from 'framer-motion';
import { TypingText } from '../typing-text';

import styles from '../styles';
import { fadeIn, staggerContainer } from '@/util/motion';

const About = () => (
    <section className="py-12 sm:py-16 relative z-10 text-white" data-testid="about">
        <div className="z-0" />
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.25 }}
            className={`${styles.innerWidth} mx-auto ${styles.flexCenter} flex-col`}
        >
            <TypingText title="| About Us" textStyles="text-center" />

            <motion.p
                variants={fadeIn('up', 'tween', 0.2, 1)}
                className="mt-[8px] font-normal sm:text-[32px] text-[20px] text-center text-secondary-white"
            >
                Zero-Knowledge UNO (zkUNO) is a cutting-edge, multiplayer digital adaptation of the classic UNO game, now enhanced with advanced Zero-Knowledge Proofs (ZKPs) technology to ensure privacy, fairness, and security in every game. Whether you're a casual player or a competitive strategist,  zkUNO offers a revolutionary gaming experience that combines the fun of UNO with the power of blockchain technology

            </motion.p>

            <motion.img
                variants={fadeIn('up', 'tween', 0.3, 1)}
                src="/arrow-down.svg"
                alt="arrow down"
                className="w-[18px] h-[28px] object-contain mt-[28px]"
            />
        </motion.div>
    </section>
);

export default About;
